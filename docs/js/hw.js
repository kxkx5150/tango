var Cells = function(a) {
    this.cells = [], a.each(function(a, b) {      
        $(b).hasClass("in") && this.cells.push(new Cell(this, $(b)))
    }.bind(this))
};
Cells.prototype = {
    set: function(a, b) {
        for (var c = 0; c < this.cells.length; c++) {
            var d = this.cells[c];
            d.num == a && d.set(b)
        }
    }
};
var Cell = function(a, b) {
    var cont = b;
    var ww = window.innerWidth;
    var tcnt = document.getElementById('onstabbar');    
    var kdich = window.innerHeight - tcnt.clientHeight*3;
    var wh = kdich*0.7;
	var str = '<canvas width="'+ww+'" height="'+wh+'">'
    this.cells = a, this.stroke = [], this.time = 0, this.timer = null, this.$cell = b, this.num = parseInt(b.find(".num").text()), this.$canvas = $(str).appendTo(b), this.$text = b.find(".txt"), this.$canvas.on("mousedown touchstart", this.touchStart.bind(this)), this.$canvas.on("blur", this.hide.bind(this))
};
Cell.prototype = {
    set: function(a) {
        this.$text.text(a)
    },
    hide: function() {
    },
    show: function(a) {
        var that = this;
        var kary = [];
        var cont = document.getElementById("hw_kanji_result_container")
        cont.innerHTML = "";
        for (var i = 0; i < a.length; i++) {
            if(a[i].length === 1&&this.isKanji(a[i])){
                kary.push(a[i])
                var span = document.createElement("span")
                cont.appendChild(span)
                span.setAttribute("class","hw_suggest_kanji")
                span.addEventListener("click",this.clickItem)
                span.textContent = a[i]
            }
        };




    },
    clickItem:function(e){
        var val = this.textContent;
        document.getElementById("kdict_search_input").value = val;
        $('#kdict_search_input').keyup();
        JVDICTSQL.getData("knjdictionary","kanji",val+"%",function(items){  
            if(items.length === 0)return;
            var obj = {};
            obj.imi = items[0].imi
            obj.kanji = items[0].kanji
            obj.kyomi = items[0].kyomi
            obj.oyomi = items[0].oyomi
            obj.v = items[0].v
            createKanjiDictInfo(obj);
        });
    },
    isKanji:function(c){
        var unicode = c.charCodeAt(0);
        if ( (unicode>=0x4e00  && unicode<=0x9fcf)  || // CJK統合漢字
             (unicode>=0x3400  && unicode<=0x4dbf)  || // CJK統合漢字拡張A
             (unicode>=0x20000 && unicode<=0x2a6df) || // CJK統合漢字拡張B
             (unicode>=0xf900  && unicode<=0xfadf)  || // CJK互換漢字
             (unicode>=0x2f800 && unicode<=0x2fa1f) )  // CJK互換漢字補助
            return true;

        return false;
    },
    send: function(e) {
        var pnode = e.currentTarget.parentNode;
        var chii = e.currentTarget.clientHeight;
        for (var a = {
                device: window.navigator.userAgent,
                input_type: 0,
                options: "enable_pre_space",
                requests: [{
                    writing_guide: {
                        writing_area_width: window.innerWidth,
                        writing_area_height: chii
                    },
                    pre_context: "",
                    max_num_results: 1,
                    max_completions: 0,
                    ink: []
                }]
            }, b = [], c = 0; c < this.stroke.length; c++) {
            for (var d = this.stroke[c], e = [], f = [], g = [], h = 0; h < d.length; h++) e.push(d[h].x), f.push(d[h].y), g.push(d[h].t);
            b.push([e, f, g])
        }
        a.requests[0].ink = b, $.ajax({
            url: "https://inputtools.google.com/request?itc=ja-t-i0-handwrit&app=appreciate_google",
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify(a),
            dataType: "json"
        }).done(function(a) {
            "SUCCESS" == a[0] && this.show(a[1][0][1])
        }.bind(this))
    },
    clear: function() {
        var a = this.$canvas[0],
            b = a.getContext("2d");
        b.clearRect(0, 0, a.width, a.height), this.time = 0, this.stroke = [], this.cells.set(this.num, "")
    },
    touchStart: function(a) {
        this.hide(), window.clearTimeout(this.timer);
        var b = this.$canvas[0],
            c = b.width / this.$canvas.width(),
            d = b.height / this.$canvas.height(),
            e = b.getContext("2d");
        e.lineWidth = 4 * c, e.lineCap = "round", e.lineJoin = "round";
        var f = function(a) {
                return a.originalEvent.touches ? a.originalEvent.touches[0].pageX : a.pageX
            },
            g = function(a) {
                return a.originalEvent.touches ? a.originalEvent.touches[0].pageY : a.pageY
            },
            h = b.width,
            i = b.height,
            j = 0,
            k = 0,
            l = 0,
            m = 0,
            n = function(a) {
                a.x * c < h / 2 && j > -1 ? (j = -1, l++) : a.x * c > h / 2 && 1 > j && (j = 1, l++), a.y * d < i / 2 && k > -1 ? (k = -1, m++) : a.y * d > i / 2 && 1 > k && (k = 1, m++)
            },
            o = function(a) {
                var h = {
                    x: f(a) - $(b).offset().left,
                    y: g(a) - $(b).offset().top,
                    t: (new Date).getTime() - this.time
                };
                q.push(h), n(h), e.lineTo(h.x * c, h.y * d), e.stroke(), a.preventDefault(),a.stopPropagation()
            },
            p = function(a) {
                a.originalEvent.touches ? ($(b).unbind("touchmove"), $(b).unbind("touchend")) : ($(b).unbind("mousemove"), $(b).unbind("mouseup")), this.stroke.push(q), l > 6 || m > 6 ? window.setTimeout(this.clear.bind(this), 500) : (this.timer = window.setTimeout(this.send.bind(this,a), 500), a.preventDefault(),a.stopPropagation())
            };
        a.originalEvent.touches ? ($(b).bind("touchmove", o.bind(this)), $(b).bind("touchend", p.bind(this))) : ($(b).bind("mousemove", o.bind(this)), $(b).bind("mouseup", p.bind(this))), 0 == this.time && (this.time = (new Date).getTime());
        var q = [],
            r = {
                x: f(a) - $(b).offset().left,
                y: g(a) - $(b).offset().top,
                t: (new Date).getTime() - this.time
            };
        q.push(r), e.beginPath(), e.moveTo(r.x * c, r.y * d), a.preventDefault(),a.stopPropagation()
    }
};



