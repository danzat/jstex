if (typeof jstex == "undefined") var jstex = {};

jstex.Glyph = function (contours, metrics) {
    var c = contours;
    console.debug(c);
    var m = metrics;
    
    this.render = function (ctx, scale, dpi) {
        // there are always 72 points in 1 inch
        // so if I have <dpi> pixels in 1 inch
        // 72pt = <dpi>px --> 1pt = <dpi>/72 px
        var px2pt = scale * dpi / 72;
        ctx.save();
        ctx.scale(1, -1);
        ctx.save();
        if (m.ymin < 0) {
            // has depth below the baseline
            ctx.fillStyle = "rgb(255, 150, 150)";
            ctx.fillRect(m.xmin*px2pt,  0,              m.xmax*px2pt - m.xmin*px2pt,    m.ymax*px2pt);
            ctx.fillStyle = "rgb(150, 150, 255)";
            ctx.fillRect(m.xmin*px2pt,  m.ymin*px2pt,   m.xmax*px2pt - m.xmin*px2pt,    -m.ymin*px2pt);
        } else {
            // all the glyph is above the baseline
            ctx.fillStyle = "rgb(255, 150, 150)";
            ctx.fillRect(m.xmin*px2pt,  m.ymin*px2pt,   m.xmax*px2pt - m.xmin*px2pt,    m.ymax*px2pt-m.ymin*px2pt);
            ctx.fillStyle = "rgb(255, 230, 230)";
            ctx.fillRect(m.xmin*px2pt,  0,              m.xmax*px2pt - m.xmin*px2pt,    m.ymin*px2pt);
        }
        ctx.restore();
        ctx.beginPath();
        for (var k = 0; k < c.length; k++) {
            var v = c[k];
            ctx.moveTo(v[0].x * px2pt, v[0].y * px2pt);
            var i = 1;
            while (i < v.length) {
                if (v[i].q) {
                    ctx.lineTo(v[i].x * px2pt, v[i].y * px2pt);
                } else {
                    ctx.quadraticCurveTo(v[i].x * px2pt, v[i].y * px2pt, v[i+1].x * px2pt, v[i+1].y * px2pt);
                    i++;
                }
                i++;
            }
        }
        ctx.fill();
        ctx.restore();
    };
};
