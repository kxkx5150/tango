Q = G6;
var optobj = {
    tts:false,
    ttsinput:false,
    sound:true,
    random:false,
    rm:true,
    mode:"select"
};
var suggesttimerid = null;
var REQID = null;
var FIREWORKS_UPDATE = null;
var MondaiIndex = -1;
var DB = null;
var request = indexedDB.open("answer-database", "1");
request.onupgradeneeded = db_onCreate;
request.onsuccess = function (e) {
    DB = this.result;
};
function zeroPadding(num){
    return ("0000000000"+num).slice(-10);
}
function db_onCreate(e) {
    var db = this.result;
    if (db.objectStoreNames.contains("items")) {
        db.deleteObjectStore("items");
    }
    var store  = db.createObjectStore("items",{
        keyPath:"index",
        autoIncrement: true
    });
}
function sendDB(level,str) {
    if(DB){
        var trans = DB.transaction(["items"], "readwrite");
        var store = trans.objectStore("items");
        var rq = store.get(str);
        rq.onsuccess = function() {
            var result = this.result;
            var data = {
                level:level,
                str:str
            };
            if(!result){
                var req = store.put(data);
            }else{
                var req = store.delete(str);
                req.onsuccess = function () {
                    var req2 = store.put(data);
                };
            }
        };
    }
}
function deleteDB(str){
    var trans = DB.transaction(["items"], "readwrite");
    var store = trans.objectStore("items");
    var req = store.delete(str);
}
function deleteObjectStore(cb){
    var trans = DB.transaction(["items"], "readwrite");
    var store = trans.objectStore("items");
    var request = store.clear();
    request.onsuccess = function (e) {
        if(cb)cb();
    }
}
function getItem(str){
    var trans = DB.transaction(["items"], "readwrite");
    var store = trans.objectStore("items");
    var req = store.get(str);
    req.onsuccess = function() {
        var result = this.result; 
    };
}
function getAllItems(callback) {
    if(DB){
        var trans = DB.transaction(["items"], "readwrite");
        var store = trans.objectStore("items");
        var items = [];
        trans.oncomplete = function(evt) {  
            callback(items);
        };
        var cursorRequest = store.openCursor();
        cursorRequest.onsuccess = function(evt) {                    
            var cursor = evt.target.result;
            if (cursor) {
                items.push(cursor.value);
                cursor.continue();
            }
        };
    }else{
        setTimeout(function(){
            getAllItems(callback)
        },200)
    }
}
var resizetimerid = null;
window.addEventListener("resize",resizeWindow,false);
window.addEventListener("orientationchange",resizeWindow,false);
function resizeWindow(e,loadflg){
    clearTimeout(resizetimerid);
    resizetimerid = setTimeout(function(){
        var wih = window.innerHeight;
        var tcnt = document.getElementById('onstabbar');    
        var sec = document.querySelector(".section-");
        var wh = window.innerHeight-tcnt.clientHeight-sec.clientHeight;
        var ch = wh/12;
        document.getElementById('mondai_container').style.height = wh + "px";
        document.getElementById('helpcontainer').style.height = wh-108 + "px";
        var cont = document.getElementById('mondai_container');
        var kcont = document.getElementById('kotae_container');
        var icont = document.getElementById('kotae_input_container');
        cont.style.height = ch*4+"px";
        kcont.style.height = ch*8+"px";
        icont.style.height = ch*8+"px";
        document.getElementById("main_container").style.width = window.innerWidth+"px";

        var kdich = wih - tcnt.clientHeight*3;
    },50)
}
window.addEventListener("load", function(event) {
    var lcs = localStorage.getItem("__opt_goie__")
    if(lcs){
        optobj = JSON.parse(lcs);
        if(optobj.random === false)document.getElementById("random_checkbox").checked = optobj.random;
        document.getElementById("tts_checkbox").checked = optobj.tts;
        document.getElementById("sr_checkbox").checked = optobj.ttsinput;
        document.getElementById("sound_checkbox").checked = optobj.sound;
        if(optobj.rm === true)document.getElementById("rmanswer_checkbox").checked = optobj.rm;
        if(optobj.mode === "input"){
            changeKotaeMode(true);
            document.getElementById("kotae_houhou").value = "input"
        }
    }
    addEvent();
    createDialog();
    lcs = localStorage.getItem("__level_goie__")
    if(lcs){
        changeLevel(null,lcs,true)
    }else{
        stat(true);
    }
    resizeWindow(null,true);
    setTimeout(function(){
        window.cells = new Cells($(".cell"));
    },200)
},false);
function stat(loadflg){
    MondaiIndex = -1;
    convertFormat();
    shuffle(Q,true);
    var callback = function(){
        setTimeout(function(){
            tsuginoMondai(false,true);

        },100);
        createList();
    };
    if(optobj.rm){
        removeRightAnswers(callback);
    }else{
        callback();
    }
}
function createList(){
    var lstcont = document.getElementById("helpcontainer");
    lstcont.innerHTML = "";
    var df = document.createDocumentFragment();
    for (var i = 0; i < Q.length; i++) {
        var lttl = Q[i].j;
        var ldiv = document.createElement("div");
        df.appendChild(ldiv)
        ldiv.innerHTML = lttl;
        ldiv.addEventListener("click",clickListItem,true);
        ldiv.setAttribute("class","list_item");
        ldiv.index = i;
    };
    lstcont.appendChild(df)
}
function searchList(value){
    var flg = false;
    if(value == "")flg = true;
    var items = document.querySelectorAll(".list_item");
    for(var ii = 0, ll = items.length; ii < ll; ii++){
        var ttl = items[ii].textContent;
        var pattern = new RegExp(value,"i");
        var match = pattern.exec(ttl);
        if((match&&(match.index > -1)) || flg){
            items[ii].style.display = "block"
        }else{
            items[ii].style.display = "none"
        }
    }
}
function clickListItem(e){
    e.stopPropagation();
    var that = e.currentTarget;
    that.style.background = "deeppink";
    setTimeout(function(){
        that.style.background = "";
        MondaiIndex = that.index-1;
        tsuginoMondai();
        var hdiv = document.getElementById("helpdiv");
        hdiv.style.left = "-800px";
        setTimeout(function(){
            hdiv.style.display = "none";
        },300)

    },200)
}
function addEvent(){
    var items = document.querySelectorAll(".kotae_item");
    for (var i = 0; i < items.length; i++) {
        items[i].addEventListener("click",clickItem)
    };
    document.getElementById("list_img").addEventListener("click",function(){
        document.getElementById("search_input").value = "";
        searchList("")
        document.getElementById("helpdiv").style.display = "block";
        document.getElementById("helpcontainer").scrollTop = 0;
        setTimeout(function(){
            document.getElementById("helpdiv").style.left = 0;
        },10)

    });   
    document.getElementById("setting_img").addEventListener("click",function(){
        document.getElementById("optdiv").style.display = "block";
        setTimeout(function(){
            document.getElementById("optdiv").style.left = 0;
        },10)
    });   
    var items = document.querySelectorAll("label.opt_checkbox");
    for (var i = 0; i < items.length; i++) {
        items[i].addEventListener("click",function(e){  
            e.stopPropagation();
        },true)
    };
    document.getElementById("random_checkbox").addEventListener("change",function(){
        optobj.random = this.checked;
        storeOptions();
        location.reload()
    });
    document.getElementById("rmanswer_checkbox").addEventListener("change",function(){
        optobj.rm = this.checked;
        storeOptions();
        deleteObjectStore();
    });
    document.getElementById("tts_checkbox").addEventListener("change",function(){
        optobj.tts = this.checked;
        storeOptions();
        location.reload()
    });
    document.getElementById("sr_checkbox").addEventListener("change",function(){
        optobj.ttsinput = this.checked;
        storeOptions();
        location.reload()
    });
    document.getElementById("sound_checkbox").addEventListener("change",function(){
        optobj.sound = this.checked;
        storeOptions();
    });   
    document.getElementById("optdiv").addEventListener("click",function(){
        var that = this;
        this.style.left = "-800px";
        setTimeout(function(){
            that.style.display = "none";
        },300)
    },false);   
    document.getElementById("helpdiv").addEventListener("click",function(){
        var that = this;
        this.style.left = "-800px";
        setTimeout(function(){
            that.style.display = "none";
        },300)
    },false);   
    document.getElementById("tab1").addEventListener("change",function(){
        if(this.checked){
            changeLevel(true,this.id);
        }
    });   
    document.getElementById("tab2").addEventListener("change",function(){
        if(this.checked){
            changeLevel(true,this.id);
        }
    });   
    document.getElementById("tab3").addEventListener("change",function(){
        if(this.checked){
            changeLevel(true,this.id);
        }
    });   
    document.getElementById("tab4").addEventListener("change",function(){
        if(this.checked){
            changeLevel(true,this.id);
        }
    });   
    document.getElementById("tab5").addEventListener("change",function(){
        if(this.checked){
            changeLevel(true,this.id);
        }
    });   
    document.getElementById("tab6").addEventListener("change",function(){
        if(this.checked){
            changeLevel(true,this.id);
        }
    });   
    document.getElementById("kotae_houhou").addEventListener("click",function(e){
        e.stopPropagation();
    });  

    document.getElementById("kotae_houhou").addEventListener("change",function(e){
        if(this.value === "input"){
            changeKotaeMode(true);
        }else{
            changeKotaeMode();
        }        
    });  
    document.getElementById("kotae_input").addEventListener("keyup",function(e){
        var val = this.value.replace(/^\s+|\s+$/g, "");
        checkKotaeInput(val)
    }); 
    document.getElementById("search_input").addEventListener("click",function(e){
        e.stopPropagation();
    });   
    document.getElementById("search_input").addEventListener("keyup",function(e){
        var val = this.value.replace(/^\s+|\s+$/g, "");
        searchList(val)
    });   
    var touchStartX;
    var touchStartY;
    var touchMoveX;
    var touchMoveY;
    var flg = false;
    window.addEventListener("touchstart", function(event) {
        touchStartX = event.touches[0].pageX;
        touchStartY = event.touches[0].pageY;
    }, false);
    window.addEventListener("touchmove", function(event) {
        touchMoveX = event.changedTouches[0].pageX;
        touchMoveY = event.changedTouches[0].pageY;
        flg = true;
    }, false);
    window.addEventListener("touchend", function(event) {
        if(!flg)return;
        var sflg = false,sflg2 = false;
        if (touchStartX > touchMoveX) {
            if (touchStartX > (touchMoveX + 76)) {
                var hcont = document.getElementById("helpdiv");
                var ocont = document.getElementById("optdiv");
                sflg = hideWrap(hcont,-500)
                sflg2 = hideWrap(ocont,-500)
                if(!sflg&&!sflg2)tsuginoMondai(true,false,true);
            }
        } else if (touchStartX < touchMoveX) {
            if ((touchStartX + 76) < touchMoveX) {
                var hcont = document.getElementById("helpdiv");
                var ocont = document.getElementById("optdiv");
                sflg = hideWrap(hcont,500)
                sflg2 = hideWrap(ocont,500)
                if(!sflg&&!sflg2)tsuginoMondai(false,false,true);
            }
        }
        flg = false;
    }, false);
    var tabs = document.querySelectorAll(".tab-bar__button")
    for (var i = 0; i < tabs.length; i++) {
        tabs[i].addEventListener("click",clickTab,false)   
    };
}
function clickTab(e){
    cancelAnimationFrame(REQID);
    resizeWindow();
    if(this.textContent.match(/^読/i)) {
        if(FIREWORKS_UPDATE)FIREWORKS_UPDATE();
    }
}
function changeKotaeMode(inptflg){
    var kcont = document.getElementById('kotae_container');
    var icont = document.getElementById('kotae_input_container');    
    if(inptflg){
        kcont.style.display = "none";
        icont.style.display = "block";
        optobj.mode = "input";
    }else{
        icont.style.display = "none";
        kcont.style.display = "block";
        optobj.mode = "select";
    }
    storeOptions();
}
function checkKotaeInput(val){
	if(!val)return;
    var mondai = Q[MondaiIndex];
    var kotae = "";
	for (var i = 0; i < Q.length; i++) {
		if(Q[i].v == mondai.v){
			kotae = checkOnaziKotae(val,Q[i]);
			if(kotae){
			    checkKotae(kotae,true,true)
				break;
			}
		}
	};
}
function checkOnaziKotae(val,mondai){
    var kotae = "";
    if(mondai.RightAns.indexOf("/") > -1){
        var anss = mondai.RightAns.split("/");
        for (var i = 0; i < anss.length; i++) {
            if(anss[i].replace(/^\s+|\s+$/g, "") === val){
                kotae = mondai.RightAns;
                break;
            }
        };
    }
    if(mondai.h.indexOf("/") > -1){
        var anss = mondai.h.split("/");
        for (var i = 0; i < anss.length; i++) {
            if(anss[i].replace(/^\s+|\s+$/g, "") === val){
                kotae = mondai.RightAns;
                break;
            }
        };
    }
    if(mondai.RightAns == val){
        kotae = mondai.RightAns;
    }
    if(mondai.h === val){
        kotae = mondai.RightAns;
    }
    return kotae
}
function changeLevel(e,id,loadflg){
    if(id === "tab1"){
        Q = G6;
    }else if(id === "tab2"){
        Q = G6;
    }else if(id === "tab3"){
        Q = G6;
    }else if(id === "tab4"){
        Q = G6;
    }else if(id === "tab5"){
        Q = G6;
    }else if(id === "tab6"){
        Q = G6;
    }
    if(!e){
        document.getElementById(id).checked = true;
    }
    stat(loadflg);
    localStorage.setItem("__level_goie__",id);
}
function removeRightAnswers(callback){
    var mcb = function(items){
        (function(items){
            var level = document.querySelector('input[name="tab"]:checked').value;
            var cary = Q.concat();
            var cb = function(){
                if(callback)callback();
            };
            for (var i = 0; i < items.length; i++) {
                for (var ii = 0; ii < Q.length; ii++) {
                    if(items[i].str == Q[ii].j&&items[i].level == "goie"+level){
                        Q.splice(ii,1)
                    }
                };
            };
            if(Q.length === 0){
                Q = cary;
                deleteObjectStore(cb);
                showDialog("一周しました<br>全問を表示します。")
            }else{
                cb();
            }
        })(items);
    };
    getAllItems(mcb);
}
function createDialog(){
    var dialog = document.createElement("dialog")
    document.body.appendChild(dialog);
    dialog.setAttribute("id","info_dialog");
    var h3 = document.createElement("h3")
    dialog.appendChild(h3);
    dialog.addEventListener("click",function(e){
        dialog.close();
        if(dialog.firstChild.textContent.indexOf("間違い　") > -1){
            dialog.firstChild.textContent = "";
            location.reload();
        }
    });
    return dialog;
}
function showDialog(txt){
    var dialog = document.getElementById("info_dialog");
    dialog.firstChild.innerHTML = txt;
    dialog.show();
}
function setInfoLabel(){
    document.getElementById("info_label").textContent = MondaiIndex+1 + " / " + Q.length;
}
function hideWrap(elem,mv){
    if(elem.style.display == "block"){
        elem.style.left = mv+"px";
        setTimeout(function(){
            elem.style.display = "none";
        },300)
        return true;
    }
    return false;
}
function storeOptions(){
    localStorage.setItem("__opt_goie__",JSON.stringify(optobj))
}
function tsuginoMondai(pre,loadflg,mvflg){
    var func = function(){
        window.scrollTo(window.innerWidth+100,0);
        showMondai();
        if(optobj.tts){

        }
        setInfoLabel();
        setTimeout(function(){
        	if(optobj.mode == "input"){
        		document.getElementById("kotae_input").focus();
        	}
        },20)
    };
    if(pre){
        MondaiIndex--;  
        if(MondaiIndex < 0){
            MondaiIndex = 0;
            return;
        }
        if(mvflg){
            moveMainContainer(window.innerWidth*-1,func)
        }
    }else{
        MondaiIndex++;  
        if(Q.length === MondaiIndex){
            MondaiIndex--;
            checkMatigai();
            return;
        }
        if(loadflg){
            func();
        }else if(mvflg){
            moveMainContainer(window.innerWidth,func)
        }else{
            var cont = document.getElementById("main_container");
            cont.style.opacity = 0;
            setTimeout(function(){
                cont.style.display = "none";
                setTimeout(function(){
                    setTimeout(function(){
                        cont.style.display = "block";
                        setTimeout(function(){
                            cont.style.opacity = 1;
                            func();
                        },10)
                    },10)
                },10)
            },300)
        }
    }
}
function moveMainContainer(mvval,func){
    var cont = document.getElementById("main_container");
    cont.style.left = mvval+"px";
    cont.style.opacity = 0;
    setTimeout(function(){
        cont.style.display = "none";
        setTimeout(function(){
            cont.style.left = 0;
            setTimeout(function(){
                cont.style.display = "block";
                setTimeout(function(){
                    cont.style.opacity = 1;
                    func();
                },10)
            },10)
        },10)
    },400)
}
function showMondai(){
    var txt = Q[MondaiIndex].Quest;
    txt = txt.replace(/〔 〕/g, "<span style='color:deeppink;font-weight:bold;'>〔 〕</span>");
    txt = txt.replace(/(\r\n|\n|\r)/g, "<br>");
    if(txt.indexOf("onaziimi") > -1){
        txt += "</span>"
    }
    if(txt.indexOf("kanji") > -1){
        var txts = txt.split(">");
        txt = txt.replace(/〔/g, "<span style='color:deeppink'>〔");
        txt = txt.replace(/〕/g, "〕</span>");
    }

    document.getElementById("mondai_container").innerHTML = txt;
    var k1 = document.getElementById("kotae1");
    var k2 = document.getElementById("kotae2");
    var k3 = document.getElementById("kotae3");
    var k4 = document.getElementById("kotae4");
    k1.innerHTML = Q[MondaiIndex].Ans[0];
    k2.innerHTML = Q[MondaiIndex].Ans[1];
    k3.innerHTML = Q[MondaiIndex].Ans[2];
    k4.innerHTML = Q[MondaiIndex].Ans[3];
    k1.setAttribute("data-txt",Q[MondaiIndex].Ans[0])
    k2.setAttribute("data-txt",Q[MondaiIndex].Ans[1])
    k3.setAttribute("data-txt",Q[MondaiIndex].Ans[2])
    k4.setAttribute("data-txt",Q[MondaiIndex].Ans[3])
    createKaisetsu(Q[MondaiIndex]);
    createReibun(Q[MondaiIndex]);
}
function createKaisetsu(mondai){
    var txt = mondai.setumei;
    if(!txt)txt =""
    txt = txt.replace(/\n/g,"<br><br>");
    if(mondai.tyuui){
        txt += "<hr><div style='color:deeppink;font-weight:bold'>Chú ý:</div>"+mondai.tyuui.replace(/\n/g,"<br><br>");
    }
}
function createReibun(mondai){
    var txts = mondai.rei;
    var html = "";
    var cnt = 0;
    if(txts){
        var reis = txts.split("\n\n");
        for(var i = 0; i < reis.length; i ++){
            if(!reis[i])continue;
            var strs = reis[i].split("\n");
            var jpstr = strs.shift();
            html += "<div class='reibun_item reibun_jp' style='color:royalblue'>" +jpstr+ '<label class="reibun_jp_hiragana" data-txt="'+jpstr+'">ひらがな</label>' +"</div>";        
            html += "<div class='reibun_item'>" +strs.join("<br>")+ "</div>";
            cnt++;
        };        
    }
}

function clickItem(e){
    var span = this.querySelector(".kotae_span");
    var txt = span.getAttribute("data-txt");
    checkKotae(txt)
}
function checkKotae(txt,inptflg,fflg){
    var flg = false;
    var mondai = Q[MondaiIndex];
    var audio = null;
    if(txt == mondai.RightAns || fflg){
        if(optobj.sound){
            audio = document.getElementById("seikai_sound");
        }
        flg = true;
        tsuginoMondai();
        if(!mondai.matigai){
            var level = document.querySelector('input[name="tab"]:checked').value;
            sendDB("goie"+level,mondai.title)
        }
        document.getElementById("kotae_input").value = "";
    }else{
        if(optobj.sound){
            audio = document.getElementById("matigai_sound");
        }
        if(inptflg)audio = null;
        mondai.matigai = true;
        if(true)showMatigai(mondai);
    }
    if(audio){
        audio.currentTime = 0;
        audio.play();
    }
    return flg;
}
function showMatigai(mondai){
    return;
    document.getElementById("helpdiv").style.display = "block";
    setTimeout(function(){
        document.getElementById("helpdiv").style.left = 0;
    },10)
    document.getElementById("helpcontainer").innerHTML = mondai.comment;
}
function checkMatigai(){
    var cnt = 0;
    for(var i = 0; i < Q.length; i ++){
        if(Q[i].matigai)cnt++;
    };
    showDialog("間違い　"+ cnt + "個")
}
function convertFormat(){
    var cnt = 0,rndn = 0,rndns = [];
    for (var i = 0; i < Q.length; i++) {
        var item = Q[i];
        item.Quest = item.v;
        item.comment = item.h;
        if(item.h){
            item.setumei = item.h;
        }else{
            item.setumei = item.j;
        }
        item.Ans = [];
        item.Ans[0] = item.j;
        item.title = item.j;
        item.rei = "";
        if(item.r&&item.r.length > 0){
            for (var ii = 0; ii < item.r.length; ii++) {
                if(item.r[ii]&&item.r[ii].j&&item.r[ii].v){
                    item.rei += item.r[ii].j +"\n"+ item.r[ii].v;
                    item.rei += "\n\n"
                }
            };
        }
        while(cnt < 3){
            rndn = rnd(Q.length-1,0);
            if((Math.abs(rndn - i) > 3)&&rndns.indexOf(rndn) === -1){
                item.Ans[cnt+1] = Q[rndn].j;
                rndns.push(rndn)
                cnt++;
            }
        }
        cnt = 0;
        rndns = [];
    };
    function rnd(max,min){
        var no = Math.floor(( Math.random() * ( ( max + 1 ) - min ) ) + min);
        return no;
    }
}
function shuffle(a,ansflg) {
    var j, x, i;
    for (i = a.length; i; i -= 1) {
        if(optobj.random || !ansflg){
            j = Math.floor(Math.random() * i);
            x = a[i - 1];
            a[i - 1] = a[j];
            a[j] = x;
        }
        if(ansflg)a[i - 1].RightAns = a[i - 1].Ans[0]+"";
        if(a[i - 1].Ans)shuffle(a[i - 1].Ans)
    }
}
function showLoading(){
    document.getElementById("dict_loadingModal").style.display = "block";
    document.getElementById("progress_info").innerHTML = "";   
}
function hiddenLoading(){
    document.getElementById("dict_loadingModal").style.display = "none";
    document.getElementById("progress_info").innerHTML = "";
}
