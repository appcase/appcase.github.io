let eg = {
    gplay:{},
    gsets:{},

    showFScreen:function(){
        if(!eg.gplay.fullscreen){
            document.documentElement.requestFullscreen();
            eg.gplay.fullscreen = true;
            $('.fscr').removeClass('fa-expand').addClass('fa-compress');
        }else{
            document.exitFullscreen();
            eg.gplay.fullscreen = false;
            $('.fscr').removeClass('fa-compress').addClass('fa-expand');
        }
    },

    showModal:function(htmlfile){
        $(".modal").html('');
        $('.modal').load('./pages/'+htmlfile);
        $('.modal').show();
    },  

    hideModal:function(){
        $(".modal").html('');
        $('.modal').hide();
        eg.gplay.flrtapped = -3;
        eg.gplay.eletapped = -3;        
    },

    hideElevatorModal:function(){
        $(".modal").html('');
        $('.modal').hide();
        eg.gplay.eletapped = -3;
        if(eg.gplay.flrtapped>=0) eg.showModal('floor.html');
    },

    randomInteger: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
        //return Math.round((min - 0.5) + Math.random() * (max - min + 1));
    },

    resetGame:function(){   
        if (prompt("Resetting the game will delete all the progress of the current play. Do you want to reset?\n\nPlease confirm your action by entering 951 in the input box below.") == 951) {
            if(eg.gplay.eAgent) clearInterval(eg.gplay.eAgent);
            localStorage.removeItem('elevator.gsets');
            localStorage.removeItem('elevator.gplay');
            $('.ppicon').removeClass('fa-pause').addClass('fa-play');
            $('.ppicon').next().next().text('Play');
            eg.toastMessage('Game reset complete!', 1500);
            eg.loadFromLocal();
        }
    },

    playGame:function(icon){
        if($(icon).hasClass('fa-play')){
            if(eg.gplay.status!='end'){
                if(!eg.gplay.eAgent) eg.gplay.eAgent = setInterval(eg.runAgent, eg.gsets.eTimer);
                $(icon).removeClass('fa-play').addClass('fa-pause');
                $(icon).next().next().text('Pause Game');
                eg.toastMessage('Game On!<br>Visitors arriving soon...', 1500);
            }else{
                eg.toastMessage('Game Over!<br>Please restart.', 5000);
            }
        }else{
            if(eg.gplay.eAgent) clearInterval(eg.gplay.eAgent);
            eg.gplay.eAgent = null;
            $(icon).removeClass('fa-pause').addClass('fa-play');
            $(icon).next().next().text('Resume Game');
            eg.toastMessage('Game paused!', 1500);
        }
    },

    toastMessage:function(html, time){
        $('#message').html(html).show();
        setTimeout(function(){ $('#message').text('').hide();}, time);
    },

    loadFromLocal:function(){
        eg.gsets = JSON.parse(localStorage.getItem('elevator.gsets'));
        eg.gplay = JSON.parse(localStorage.getItem('elevator.gplay'));
        if(!eg.gsets){
            eg.gsets = {floors:10, elevators:7, eTimer:500*6, fTimer:7};
        }        
        if(!eg.gplay){
            eg.gplay = {floors:[], elevators:[], history:[], pmoved:0, itwait:0, twait:0, wratio:0, status:'play'};
        }
        eg.gplay.eAgent = null;
        eg.gplay.fullscreen = false;
        if(!eg.gplay.eAgentRun) eg.gplay.eAgentRun = eg.gsets.fTimer;
        eg.gplay.flrtapped = -3;
        eg.gplay.eletapped = -3;
        eg.setupGame();     
    },

    setupGame:function(){      
        let html = '<table id="statTab" style="width:100%;font-size:14px;font-family:Orbitron;"><tr><td style="width:60%;border:0;text-align:left;font-weight:bold;color:purple;">Visitors Moved: '+eg.gplay.pmoved+'</td><td style="width:40%;border:0;text-align:left;font-weight:bold;color:purple;">Op Ratio: '+eg.gplay.wratio+'</td></tr></table>';  
        html += '<table id="elevators" style="font-size:12px;font-family:Orbitron;">';
        for(let i=eg.gsets.floors; i>=0; i--){
            html += '<tr>';
            for(let j=0; j<=eg.gsets.elevators; j++){
                if(j==0){
                    if(i==0) html += '<td style="width:23%;text-align:left;color:white;" onclick="eg.showFDetails(this);">&nbsp;<b>F: 0</b><b><span class="fvnone vcount">0</span></b></td>';
                    if(i!=0) html += '<td style="width:23%;text-align:left;" onclick="eg.showFDetails(this);">&nbsp;<b>F: '+i+'</b><b><span class="fvnone vcount">0</span></b></td>';
                }else{
                    html += '<td style="width:11%;" onclick="eg.showEDetails(this);">&nbsp;</td>';
                }
            }
            html += '</tr>';
        }
        html += '</table><div style="text-align:center;color:purple;font-size:15px;">Op Ratio below or equal to 1 ensures that all the visitors are reaching their floors on or before expected time.<br><u>Try to keep it as low as possible!</u></div><div style="text-align:center;color:purple;font-size:15px;">Do not forget to check <i style="cursor:pointer;" class="fas fa-lg fa-question-circle lime" onclick="eg.showModal(\'help.html\')"></i> for game instructions.</div>';
        $('#appbody').html(html);
        $('.vcount').off('fill').on('fill', function(){
            if(parseInt($(this).text()) > 0) $(this).removeClass('fvpres fvnone').addClass('fvpres')
            if(parseInt($(this).text()) == 0) $(this).removeClass('fvpres fvnone').addClass('fvnone')
        });
        let rowpos = $('#elevators tr:last').position();
        $('#appbody').scrollTop(rowpos.top);

        if(eg.gplay.floors.length==0){
            for(let i=eg.gsets.floors; i>=0; i--){
                eg.gplay.floors.push({id:i, ctotal:0, visitorsU:[], visitorsD:[], runvid:0});
            }
        }else{
            for(let i=0; i<eg.gplay.floors.length; i++){
                $('#elevators tr:eq('+i+') td:eq(0) span').text(eg.gplay.floors[i].ctotal);
            }
        }
        $('.vcount').trigger('fill');
        if(eg.gplay.elevators.length==0){
            for(let i=0; i<eg.gsets.elevators; i++){
                eg.gplay.elevators.push({mode:'S', maxweight:500*3, curFloorIndex:eg.gsets.floors, totweight:0, visitorsU:[], visitorsD:[]});
            }
        }
        for(let i=0; i<eg.gplay.elevators.length; i++){
            $("#elevators").find('tr:eq('+eg.gsets.floors+')').find('td:eq('+(i+1)+')').html('<i class="fas fa-sm fa-doors-closed red"></i><br><b>E-'+(i+1)+'</b>').css('color', 'white').css('font-size', '12px').css('font-family', 'Orbitron');

            if(eg.gplay.elevators[i].mode=='S'){
                if(eg.gplay.elevators[i].curFloorIndex == eg.gsets.floors)
                    $("#elevators").find('tr:eq('+(eg.gplay.elevators[i].curFloorIndex)+')').find('td:eq('+(i+1)+')').html('<i class="fas fa-sm fa-door-open red"></i><br><b>E-'+(i+1)+'</b>').css('color', 'white').css('font-size', '12px').css('font-family', 'Orbitron');
                else
                    $("#elevators").find('tr:eq('+(eg.gplay.elevators[i].curFloorIndex)+')').find('td:eq('+(i+1)+')').html('<i class="fas fa-sm fa-door-open red"></i>');
            }else{
                if(eg.gplay.elevators[i].curFloorIndex == eg.gsets.floors)
                    $("#elevators").find('tr:eq('+(eg.gplay.elevators[i].curFloorIndex)+')').find('td:eq('+(i+1)+')').html('<i class="fas fa-sm fa-door-closed red"></i><br><b>E-'+(i+1)+'</b>').css('color', 'white').css('font-size', '12px').css('font-family', 'Orbitron');
                else
                    $("#elevators").find('tr:eq('+(eg.gplay.elevators[i].curFloorIndex)+')').find('td:eq('+(i+1)+')').html('<i class="fas fa-sm fa-columns red"></i>');
            }
        }

        localStorage.setItem('elevator.gsets', JSON.stringify(eg.gsets));
        localStorage.setItem('elevator.gplay', JSON.stringify(eg.gplay));
    },

    runAgent:function(){
        eg.calcWait();
        if(eg.gplay.eAgentRun==eg.gsets.fTimer){
            eg.generateFCrowd();
            eg.gplay.eAgentRun = 0;
        }
        eg.exeEleLogic();
        eg.updateElePanel();
        if(eg.gplay.flrtapped>=0) eg.showDetailsFlr();
        if(eg.gplay.eletapped>=0) eg.showDetailsEle();
        eg.gplay.eAgentRun++ ;
        localStorage.setItem('elevator.gsets', JSON.stringify(eg.gsets));
        localStorage.setItem('elevator.gplay', JSON.stringify(eg.gplay));
        if(eg.gplay.status=='end'){
            if(eg.gplay.eAgent) clearInterval(eg.gplay.eAgent);
            eg.toastMessage('Game Over!', 5000);
            $('.ppicon').removeClass('fa-pause').addClass('fa-play');
            $('.ppicon').next().next().text('Play');
        }
        //console.log(eg.gplay);
    },
    
    calcWait:function(){
        for(let i=0; i<eg.gplay.floors.length; i++){
            for(let j=0; j<eg.gplay.floors[i].visitorsU.length; j++){
                eg.gplay.floors[i].visitorsU[j].qwait += (eg.gsets.eTimer)/1000;
            }
            for(let j=0; j<eg.gplay.floors[i].visitorsD.length; j++){
                eg.gplay.floors[i].visitorsD[j].qwait += (eg.gsets.eTimer)/1000;
            }
        }
        for(let i=0; i<eg.gplay.elevators.length; i++){
            for(let j=0; j<eg.gplay.elevators[i].visitorsU.length; j++){
                eg.gplay.elevators[i].visitorsU[j].qwait += (eg.gsets.eTimer)/1000;
            }
            for(let j=0; j<eg.gplay.elevators[i].visitorsD.length; j++){
                eg.gplay.elevators[i].visitorsD[j].qwait += (eg.gsets.eTimer)/1000;
            }
        }
    },

    generateFCrowd:function(){
        let crowdG = eg.randomInteger(1, eg.gsets.elevators/2);
        let randomIndex = eg.randomInteger(0, eg.gsets.floors-1);
        let crowdU = eg.randomInteger(0, eg.gsets.elevators/2);
        let crowdD = eg.randomInteger(0, eg.gsets.elevators/2); 

        for(let i=1; i<=crowdG; i++){
            eg.gplay.floors[eg.gplay.floors.length-1].runvid++ ;
            eg.gplay.floors[eg.gplay.floors.length-1].ctotal++ ;
            let toF = eg.randomInteger(1, eg.gsets.floors);
            eg.gplay.floors[eg.gplay.floors.length-1].visitorsU.unshift({id: eg.gplay.floors[eg.gplay.floors.length-1].id+'|'+eg.gplay.floors[eg.gplay.floors.length-1].runvid, assignedE:'X', dir:'U', qwait:0, iwait: (eg.gsets.eTimer*(eg.randomInteger(5, 9) + (eg.gplay.floors.length-1) - (eg.gplay.floors.length-1-toF)))/1000, weight: eg.randomInteger(3, 100), fromF:0, toF:toF, fromI:eg.gplay.floors.length-1, toI:eg.gplay.floors.length-1-toF});
            $('#elevators tr:eq('+eg.gsets.floors+') td:eq(0) span').text(eg.gplay.floors[eg.gplay.floors.length-1].ctotal);
        }
        if(randomIndex>0){
            for(let i=1; i<=crowdU; i++){
                eg.gplay.floors[randomIndex].runvid++ ;
                eg.gplay.floors[randomIndex].ctotal++ ;
                let toF = eg.randomInteger(eg.gsets.floors-randomIndex+1, eg.gsets.floors);
                eg.gplay.floors[randomIndex].visitorsU.unshift({id: eg.gplay.floors[randomIndex].id+'|'+eg.gplay.floors[randomIndex].runvid, assignedE:'X', dir:'U', qwait:0, iwait: (eg.gsets.eTimer*(eg.randomInteger(5, 9) + (randomIndex) - (eg.gplay.floors.length-1-toF)))/1000, weight: eg.randomInteger(3, 100), fromF:eg.gsets.floors-randomIndex, toF:toF, fromI:randomIndex, toI:eg.gplay.floors.length-1-toF});
            }
        }
        for(let i=1; i<=crowdD; i++){
            eg.gplay.floors[randomIndex].runvid++ ;
            eg.gplay.floors[randomIndex].ctotal++ ;
            let toF = eg.randomInteger(0, eg.gsets.floors-randomIndex-1);
            eg.gplay.floors[randomIndex].visitorsD.unshift({id: eg.gplay.floors[randomIndex].id+'|'+eg.gplay.floors[randomIndex].runvid, assignedE:'X', dir:'D', qwait:0, iwait: (eg.gsets.eTimer*(eg.randomInteger(5, 9) + (eg.gplay.floors.length-1-toF) - (randomIndex)))/1000, weight: eg.randomInteger(3, 100), fromF:eg.gsets.floors-randomIndex, toF:toF, fromI:randomIndex, toI:eg.gplay.floors.length-1-toF});
        }
        $('#elevators tr:eq('+randomIndex+') td:eq(0) span').text(eg.gplay.floors[randomIndex].ctotal);
        $('.vcount').trigger('fill');

        for(let j=0; j<eg.gplay.floors.length; j++){
            if(eg.gplay.floors[j].ctotal>50){
                eg.gplay.status = 'end';
                break;
            }
        }
    },

    exeEleLogic:function(){

        $('#statTab tr td:eq(0)').text('Visitors Moved: '+eg.gplay.pmoved);
        eg.gplay.wratio = (eg.gplay.twait/eg.gplay.itwait).toFixed(3);
        $('#statTab tr td:eq(1)').text('Op Ratio: '+eg.gplay.wratio);

        if(eg.gplay.wratio>10){
            eg.gplay.status = 'end';
            return;
        }

        for(let i=0; i<eg.gplay.elevators.length; i++){

            for(let j=0; j<eg.gplay.floors.length; j++){
                if(j == eg.gsets.floors)
                    $("#elevators").find('tr:eq('+j+')').find('td:eq('+(i+1)+')').html('<i class="fas fa-sm fa-doors-closed red"></i><br><b>E-'+(i+1)+'</b>').css('color', 'white').css('font-size', '12px').css('font-family', 'Orbitron');
                else
                    $("#elevators").find('tr:eq('+j+')').find('td:eq('+(i+1)+')').html('&nbsp;');
            }

            if(eg.gplay.elevators[i].mode == 'S'){

                let cout = 0;
                eg.gplay.elevators[i].totweight = 0;
                for(let j=eg.gplay.elevators[i].visitorsU.length-1; j>=0; j--){                    
                    if(eg.gplay.elevators[i].visitorsU[j].toI == eg.gplay.elevators[i].curFloorIndex){
                        cout++ ;
                        if(cout<=5){
                            eg.gplay.pmoved++;
                            $('#statTab tr td:eq(0)').text('Visitors Moved: '+eg.gplay.pmoved);
                            eg.gplay.itwait += eg.gplay.elevators[i].visitorsU[j].iwait;
                            eg.gplay.twait += eg.gplay.elevators[i].visitorsU[j].qwait;
                            //eg.gplay.history.unshift(eg.gplay.elevators[i].visitorsU.splice(j, 1)[0]);
                            eg.gplay.elevators[i].visitorsU.splice(j, 1);
                        }else{
                            eg.gplay.elevators[i].totweight += eg.gplay.elevators[i].visitorsU[j].weight;
                        }
                    }else{
                        eg.gplay.elevators[i].totweight += eg.gplay.elevators[i].visitorsU[j].weight;
                    }
                }
                if(cout<5){
                    for(let j=eg.gplay.elevators[i].visitorsD.length-1; j>=0; j--){                    
                        if(eg.gplay.elevators[i].visitorsD[j].toI == eg.gplay.elevators[i].curFloorIndex){
                            cout++ ;
                            if(cout<=5){
                                eg.gplay.pmoved++;
                                $('#statTab tr td:eq(0)').text('Visitors Moved: '+eg.gplay.pmoved);
                                eg.gplay.itwait += eg.gplay.elevators[i].visitorsD[j].iwait;
                                eg.gplay.twait += eg.gplay.elevators[i].visitorsD[j].qwait;
                                //eg.gplay.history.unshift(eg.gplay.elevators[i].visitorsD.splice(j, 1)[0]);
                                eg.gplay.elevators[i].visitorsD.splice(j, 1);
                            }else{
                                eg.gplay.elevators[i].totweight += eg.gplay.elevators[i].visitorsD[j].weight;
                            }
                        }else{
                            eg.gplay.elevators[i].totweight += eg.gplay.elevators[i].visitorsD[j].weight;
                        }
                    }
                }

                for(let k=eg.gplay.floors[eg.gplay.elevators[i].curFloorIndex].visitorsU.length-1; k>=0; k--){
                    if(eg.gplay.floors[eg.gplay.elevators[i].curFloorIndex].visitorsU[k].assignedE==i){
                        if(eg.gplay.elevators[i].totweight+eg.gplay.floors[eg.gplay.elevators[i].curFloorIndex].visitorsU[k].weight <= eg.gplay.elevators[i].maxweight){
                            let xyz = eg.gplay.floors[eg.gplay.elevators[i].curFloorIndex].visitorsU.splice(k, 1)[0];
                            eg.gplay.elevators[i].visitorsU.unshift(xyz);
                            eg.gplay.elevators[i].totweight += xyz.weight;
                        }
                    }
                }
                for(let k=eg.gplay.floors[eg.gplay.elevators[i].curFloorIndex].visitorsD.length-1; k>=0; k--){    
                    if(eg.gplay.floors[eg.gplay.elevators[i].curFloorIndex].visitorsD[k].assignedE==i){
                        if(eg.gplay.elevators[i].totweight+eg.gplay.floors[eg.gplay.elevators[i].curFloorIndex].visitorsD[k].weight <= eg.gplay.elevators[i].maxweight){
                            let xyz = eg.gplay.floors[eg.gplay.elevators[i].curFloorIndex].visitorsD.splice(k, 1)[0];
                            eg.gplay.elevators[i].visitorsD.unshift(xyz);
                            eg.gplay.elevators[i].totweight += xyz.weight;
                        }
                    }
                }
                eg.gplay.floors[eg.gplay.elevators[i].curFloorIndex].ctotal = eg.gplay.floors[eg.gplay.elevators[i].curFloorIndex].visitorsU.length + eg.gplay.floors[eg.gplay.elevators[i].curFloorIndex].visitorsD.length;
                $('#elevators tr:eq('+eg.gplay.elevators[i].curFloorIndex+') td:eq(0) span').text(eg.gplay.floors[eg.gplay.elevators[i].curFloorIndex].ctotal);
                $('.vcount').trigger('fill');

                let shouldmove = true;
                if(eg.gplay.elevators[i].visitorsU.length==0 && eg.gplay.elevators[i].visitorsD.length==0){
                    let assigned = false;
                    for(let j=0; j<eg.gplay.floors.length;j++){
                        for(let k=0; k<eg.gplay.floors[j].visitorsU.length;k++){
                            if(eg.gplay.floors[j].visitorsU[k].assignedE==i) assigned = true;
                        }
                        for(let k=0; k<eg.gplay.floors[j].visitorsD.length;k++){
                            if(eg.gplay.floors[j].visitorsD[k].assignedE==i) assigned = true;
                        }
                    }
                    shouldmove = assigned;
                }else{
                    for(let j=0; j<eg.gplay.elevators[i].visitorsU.length; j++){
                        if(eg.gplay.elevators[i].visitorsU[j].toI == eg.gplay.elevators[i].curFloorIndex) shouldmove = false;
                    }
                    for(let j=0; j<eg.gplay.elevators[i].visitorsD.length; j++){
                        if(eg.gplay.elevators[i].visitorsD[j].toI == eg.gplay.elevators[i].curFloorIndex) shouldmove = false;
                    }
                } 

                if(shouldmove) eg.gplay.elevators[i].mode = 'M';

                if(eg.gplay.elevators[i].mode=='S'){
                    if(eg.gplay.elevators[i].curFloorIndex == eg.gsets.floors)
                        $("#elevators").find('tr:eq('+(eg.gplay.elevators[i].curFloorIndex)+')').find('td:eq('+(i+1)+')').html('<i class="fas fa-sm fa-door-open red"></i><br><b>E-'+(i+1)+'</b>').css('color', 'white').css('font-size', '12px').css('font-family', 'Orbitron');
                    else
                        $("#elevators").find('tr:eq('+(eg.gplay.elevators[i].curFloorIndex)+')').find('td:eq('+(i+1)+')').html('<i class="fas fa-sm fa-door-open red"></i>');
                }else{
                    if(eg.gplay.elevators[i].curFloorIndex == eg.gsets.floors)
                        $("#elevators").find('tr:eq('+(eg.gplay.elevators[i].curFloorIndex)+')').find('td:eq('+(i+1)+')').html('<i class="fas fa-sm fa-door-closed red"></i><br><b>E-'+(i+1)+'</b>').css('color', 'white').css('font-size', '12px').css('font-family', 'Orbitron');
                    else
                        $("#elevators").find('tr:eq('+(eg.gplay.elevators[i].curFloorIndex)+')').find('td:eq('+(i+1)+')').html('<i class="fas fa-sm fa-door-closed red"></i>');
                }
                continue;
            }

            if(eg.gplay.elevators[i].mode == 'M'){

                let dir = 'U';
                let reachingFInd = 0;

                if(eg.gplay.elevators[i].visitorsU.length==0 && eg.gplay.elevators[i].visitorsD.length==0){
                    for(let j=0; j<eg.gplay.floors.length;j++){
                        for(let k=0; k<eg.gplay.floors[j].visitorsU.length;k++){
                            if(eg.gplay.floors[j].visitorsU[k].assignedE==i){
                                if(eg.gplay.floors[j].visitorsU[k].fromI > eg.gplay.elevators[i].curFloorIndex){
                                    dir = 'D';
                                }
                            }
                        }
                        if(dir=='U'){
                            for(let k=0; k<eg.gplay.floors[j].visitorsD.length;k++){
                                if(eg.gplay.floors[j].visitorsD[k].assignedE==i){
                                    if(eg.gplay.floors[j].visitorsD[k].fromI > eg.gplay.elevators[i].curFloorIndex){
                                        dir = 'D';
                                    }
                                }
                            }
                        }
                    }
                }else{
                    if(eg.gplay.elevators[i].visitorsU.length < eg.gplay.elevators[i].visitorsD.length) dir = 'D';
                }

                eg.gplay.elevators[i].dir = dir;
                reachingFInd = (dir=='U') ? eg.gplay.elevators[i].curFloorIndex - 1 : eg.gplay.elevators[i].curFloorIndex + 1;

                eg.gplay.elevators[i].curFloorIndex = reachingFInd;

                let shouldstop = false;
                for(let j=eg.gplay.elevators[i].visitorsU.length-1; j>=0; j--){                    
                    if(eg.gplay.elevators[i].visitorsU[j].toI == eg.gplay.elevators[i].curFloorIndex){
                        shouldstop = true;
                    }
                }
                for(let j=eg.gplay.elevators[i].visitorsD.length-1; j>=0; j--){                    
                    if(eg.gplay.elevators[i].visitorsD[j].toI == eg.gplay.elevators[i].curFloorIndex){
                        shouldstop = true;
                    }
                }
                
                for(let k=eg.gplay.floors[eg.gplay.elevators[i].curFloorIndex].visitorsU.length-1; k>=0; k--){
                    if(eg.gplay.floors[eg.gplay.elevators[i].curFloorIndex].visitorsU[k].assignedE==i){
                        if(eg.gplay.elevators[i].totweight+eg.gplay.floors[eg.gplay.elevators[i].curFloorIndex].visitorsU[k].weight <= eg.gplay.elevators[i].maxweight){
                            shouldstop = true;
                        }
                    }
                }
                for(let k=eg.gplay.floors[eg.gplay.elevators[i].curFloorIndex].visitorsD.length-1; k>=0; k--){    
                    if(eg.gplay.floors[eg.gplay.elevators[i].curFloorIndex].visitorsD[k].assignedE==i){
                        if(eg.gplay.elevators[i].totweight+eg.gplay.floors[eg.gplay.elevators[i].curFloorIndex].visitorsD[k].weight <= eg.gplay.elevators[i].maxweight){
                            shouldstop = true;
                        }
                    }
                }

                if(shouldstop) eg.gplay.elevators[i].mode = 'S';

                if(eg.gplay.elevators[i].mode=='S'){
                    if(eg.gplay.elevators[i].curFloorIndex == eg.gsets.floors)
                        $("#elevators").find('tr:eq('+(eg.gplay.elevators[i].curFloorIndex)+')').find('td:eq('+(i+1)+')').html('<i class="fas fa-sm fa-door-open red"></i><br><b>E-'+(i+1)+'</b>').css('color', 'white').css('font-size', '12px').css('font-family', 'Orbitron');
                    else
                        $("#elevators").find('tr:eq('+(eg.gplay.elevators[i].curFloorIndex)+')').find('td:eq('+(i+1)+')').html('<i class="fas fa-sm fa-door-open red"></i>');
                }else{
                    if(eg.gplay.elevators[i].curFloorIndex == eg.gsets.floors)
                        $("#elevators").find('tr:eq('+(eg.gplay.elevators[i].curFloorIndex)+')').find('td:eq('+(i+1)+')').html('<i class="fas fa-sm fa-door-closed red"></i><br><b>E-'+(i+1)+'</b>').css('color', 'white').css('font-size', '12px').css('font-family', 'Orbitron');
                    else
                        $("#elevators").find('tr:eq('+(eg.gplay.elevators[i].curFloorIndex)+')').find('td:eq('+(i+1)+')').html('<i class="fas fa-sm fa-columns red"></i>');
                }
                continue;
            }

        }
    },

    updateElePanel:function(){
        for(let i=0; i<eg.gplay.elevators.length; i++){
            let atFlr = eg.gsets.floors - eg.gplay.elevators[i].curFloorIndex;
            let dir = 'U';
            if(!eg.gplay.elevators[i].dir) dir = '';
            else{
                if (eg.gplay.elevators[i].dir=='D') dir = 'D';
            }
            let icon = '';
            if(dir=='U') icon = 'fa-arrow-up';
            if(dir=='D') icon = 'fa-arrow-down';
            $("#elevators").find('tr:eq('+eg.gsets.floors+')').find('td:eq('+(i+1)+')').append('<br><span style="font-family:Orbitron;font-size:12px;">'+atFlr+'&nbsp;<i class="fas fa-sm '+icon+' lime"></i></span>');
        }
    },

    showDetailsFlr:function(){
        $('.navappnameflr').text('Floor '+parseInt(eg.gsets.floors - eg.gplay.flrtapped) + ' Details');
        let html = '<table style="width:100%;border:0;"><tr>';
        let countU = (eg.gplay.floors[eg.gplay.flrtapped].visitorsU) ? eg.gplay.floors[eg.gplay.flrtapped].visitorsU.length : 0;
        let countD = (eg.gplay.floors[eg.gplay.flrtapped].visitorsD) ? eg.gplay.floors[eg.gplay.flrtapped].visitorsD.length : 0;
        html += '<td style="width:23%;text-align:center;font-family:Orbitron;font-size:14px;background-color:bisque;"><b>Visitors</b></td>';  
        html += '<td colspan='+eg.gplay.elevators.length+' style="text-align:center;font-family:Orbitron;font-size:14px;background-color:bisque;"><b>Tap Grid Boxes To Assign Elevator</b></td></tr><tr><td style="background-color:bisque;font-family:Orbitron;font-size:14px;"><b>'+parseInt(countU+countD)+'<br>People</b></td>';
        for(let i=0; i<eg.gplay.elevators.length; i++){
            let atFlr = eg.gsets.floors - eg.gplay.elevators[i].curFloorIndex;
            let dir = 'U';
            if(!eg.gplay.elevators[i].dir) dir = '';
            else{
                if (eg.gplay.elevators[i].dir=='D') dir = 'D';
            }
            let icon = '';
            if(dir=='U') icon = 'fa-arrow-up';
            if(dir=='D') icon = 'fa-arrow-down';
            //let atFlr = eg.gplay.elevators[i].curFloorIndex - eg.gplay.flrtapped;
            //let icon = (atFlr < 0) ? 'fa-arrow-down' : 'fa-arrow-up';
            html += '<td style="text-align:center;font-size:15px;background-color:#333;color:white;cursor:pointer;" onclick="eg.showEDetails(this);"><i class="fas fa-sm fa-door-closed red"></i><br><span style="font-family:Orbitron;font-size:12px;font-weight:500;"><b>E-'+(i+1)+'</b></span><br><span style="font-family:Orbitron;font-size:12px;">'+atFlr+'&nbsp;<i class="fas fa-sm '+icon+' lime"></i></span></td>'; 
        }
        html += '</tr>';
        for(let i=eg.gplay.floors[eg.gplay.flrtapped].visitorsU.length-1; i>=0; i--){
            html += '<tr><td style="width:23%;text-align:left;font-size:15px;padding-left:1px;"><table style="width:100%;"><tr><td colspan=2 style="border:0;text-align:center;font-family:Orbitron;font-size:14px;font-weight:bold;"><u>'+eg.gplay.floors[eg.gplay.flrtapped].visitorsU[i].id+'</u></td></tr><tr><td style="border:0;text-align:center;"><i class="fas fa-lg fa-arrow-circle-up red"></td><td style="border:0;"><span style="background-color:yellow;font-family:Orbitron;font-size:14px;"><b>'+eg.gplay.floors[eg.gplay.flrtapped].visitorsU[i].fromF+' - '+eg.gplay.floors[eg.gplay.flrtapped].visitorsU[i].toF+'</b></span></td></tr><tr><td style="border:0;text-align:center;"><i class="fas fa-stopwatch purple"></i></td><td style="border:0;font-family:Orbitron;font-size:14px;"><b>'+eg.gplay.floors[eg.gplay.flrtapped].visitorsU[i].qwait+'</b></td></tr><tr><td style="border:0;text-align:center;"><i class="fas fa-weight purple"></i></td><td style="border:0;font-family:Orbitron;font-size:14px;"><b>'+eg.gplay.floors[eg.gplay.flrtapped].visitorsU[i].weight+'</b></td></tr></table></td>'; 
            for(let j=0; j<eg.gplay.elevators.length; j++){
                let color = (j == eg.gplay.floors[eg.gplay.flrtapped].visitorsU[i].assignedE) ? 'lightgreen' : 'transparent';
                html += '<td style="width:11%;cursor:pointer; background-color:'+color+';" onclick="eg.assignEle(\'U\',\''+eg.gplay.floors[eg.gplay.flrtapped].visitorsU[i].id+'\', this);">&nbsp;</td>'; 
            }
            html += '</tr>';
        }
        for(let i=eg.gplay.floors[eg.gplay.flrtapped].visitorsD.length-1; i>=0; i--){
            html += '<tr><td style="width:23%;text-align:left;font-size:15px;padding-left:1px;"><table style="width:100%;"><tr><td colspan=2 style="border:0;text-align:center;font-family:Orbitron;font-size:14px;font-weight:bold;"><u>'+eg.gplay.floors[eg.gplay.flrtapped].visitorsD[i].id+'</u></td></tr><tr><td style="border:0;text-align:center;"><i class="fas fa-lg fa-arrow-circle-down blue"></td><td style="border:0;"><span style="background-color:yellow;font-family:Orbitron;font-size:14px;"><b>'+eg.gplay.floors[eg.gplay.flrtapped].visitorsD[i].fromF+' - '+eg.gplay.floors[eg.gplay.flrtapped].visitorsD[i].toF+'</b></span></td></tr><tr><td style="border:0;text-align:center;"><i class="fas fa-stopwatch purple"></i></td><td style="border:0;font-family:Orbitron;font-size:14px;"><b>'+eg.gplay.floors[eg.gplay.flrtapped].visitorsD[i].qwait+'</b></td></tr><tr><td style="border:0;text-align:center;"><i class="fas fa-weight purple"></i></td><td style="border:0;font-family:Orbitron;font-size:14px;"><b>'+eg.gplay.floors[eg.gplay.flrtapped].visitorsD[i].weight+'</b></td></tr></table></td>'; 
            for(let j=0; j<eg.gplay.elevators.length; j++){
                let color = (j == eg.gplay.floors[eg.gplay.flrtapped].visitorsD[i].assignedE) ? 'lightgreen' : 'transparent';
                html += '<td style="width:11%;cursor:pointer; background-color:'+color+';" onclick="eg.assignEle(\'D\',\''+eg.gplay.floors[eg.gplay.flrtapped].visitorsD[i].id+'\', this);">&nbsp;</td>'; 
            }
            html += '</tr>';
        }
        html += '</table>';
        $('.modalbodybnavflr').html('').html(html);
        html = '<br><div style="text-align:left;padding:5px;margin:5px;border:1px solid #333;border-radius:7px;">Tap on a grid box to assign the visitor of that row to the elevator of that column. It will turn green.<br>Tap on a green box to unassign. It will turn white.<br><br>Legends:<br><span style="background-color:yellow;"><b>X - Y</b></span>: Visitor to move from floor X to floor Y.<br>';
        html += '<i class="fas fa-stopwatch purple"></i>: Visitor\'s waiting time (in seconds). Try to keep it low!<br>';
        html += '<i class="fas fa-weight purple"></i>: Visitor\'s weight (in \'as you like it\' units).<br>';
        html += '<span style="background-color:#333;color:white;">&nbspX<i class="fas fa-arrow-up lime"></i>&nbsp;</span>: Elevator should move up X floors to reach here.<br>';
        html += '<span style="background-color:#333;color:white;">&nbspY<i class="fas fa-arrow-down lime"></i>&nbsp;</span>: Elevator should move down Y floors to reach here.<br>';
        $('.modalbodybnavflr').append(html);     
    },

    showDetailsEle:function(){
        let ele = eg.gplay.eletapped - 1;
        $('.navappnameele').text('Elevator E-'+eg.gplay.eletapped+ ' Details');
        $('.modalbodybnavele div div:eq(0)').html('Weight<br>'+eg.gplay.elevators[ele].totweight+' units')
        let curfloor = eg.gsets.floors - eg.gplay.elevators[ele].curFloorIndex;
        let dir = 'U';
        if(!eg.gplay.elevators[ele].dir) dir = '';
        else{
            if (eg.gplay.elevators[ele].dir=='D') dir = 'D';
        }
        let icon = '';
        if(dir=='U') icon = 'fa-arrow-up';
        if(dir=='D') icon = 'fa-arrow-down';
        $('.modalbodybnavele div div:eq(1)').html('Floor<br>'+curfloor+'&nbsp;<i class="fas fa-sm '+icon+' red"></i>');
        $('.modalbodybnavele div div:eq(1)').data('floor', eg.gplay.elevators[ele].curFloorIndex);
        let countU = (eg.gplay.elevators[ele].visitorsU) ? eg.gplay.elevators[ele].visitorsU.length : 0;
        let countD = (eg.gplay.elevators[ele].visitorsD) ? eg.gplay.elevators[ele].visitorsD.length : 0;
        $('.modalbodybnavele div div:eq(2)').html('Person<br>'+parseInt(countU+countD));

        let html = '<table style="width:100%;font-weight:normal;font-size:12px;font-family:Orbitron;"><tr><td style="width:20%;background-color:#333;color:white;">Visitor</td><td style="width:15%;background-color:#333;color:white;">From</td><td style="width:15%;background-color:#333;color:white;">To</td><td style="width:15%;background-color:#333;color:white;">Weight</td><td style="width:35%;background-color:#333;color:white;">Wait</td></tr>';
        for(let i=0; i<eg.gplay.elevators[ele].visitorsU.length; i++){
            html+= '<tr><td>'+eg.gplay.elevators[ele].visitorsU[i].id+'</td><td>'+eg.gplay.elevators[ele].visitorsU[i].fromF+'</td><td>'+eg.gplay.elevators[ele].visitorsU[i].toF+'</td><td>'+eg.gplay.elevators[ele].visitorsU[i].weight+'</td><td>'+eg.gplay.elevators[ele].visitorsU[i].qwait+' / '+eg.gplay.elevators[ele].visitorsU[i].iwait+'</td></tr>';
        }
        for(let i=0; i<eg.gplay.elevators[ele].visitorsD.length; i++){
            html+= '<tr><td>'+eg.gplay.elevators[ele].visitorsD[i].id+'</td><td>'+eg.gplay.elevators[ele].visitorsD[i].fromF+'</td><td>'+eg.gplay.elevators[ele].visitorsD[i].toF+'</td><td>'+eg.gplay.elevators[ele].visitorsD[i].weight+'</td><td>'+eg.gplay.elevators[ele].visitorsD[i].qwait+' / '+eg.gplay.elevators[ele].visitorsD[i].iwait+'</td></tr>';
        }
       html+= '</table>';
       $('.elepassengers').html(html);
    },

    showEDetails:function(cell){
        eg.gplay.eletapped = $(cell).closest('td').index();
        eg.showModal('elevator.html');
    },

    showFDetails:function(cell){
        eg.gplay.flrtapped = $(cell).closest('tr').index();
        eg.showModal('floor.html');
    },
}

$(document).ready(function(){
    $('.modal')[0].style.display = 'none';
    eg.loadFromLocal();
});