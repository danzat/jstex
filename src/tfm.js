if (typeof jstex == "undefined") var jstex = {};

jstex.TFM = function (url) {
    var file = new jstex.XHRFile(url);

    var lf = file.UBInt16();
    var lh = file.UBInt16();
    var bc = file.UBInt16();
    var ec = file.UBInt16();
    var nw = file.UBInt16();
    var nh = file.UBInt16();
    var nd = file.UBInt16();
    var ni = file.UBInt16();
    var nl = file.UBInt16();
    var nk = file.UBInt16();
    var ne = file.UBInt16();
    var np = file.UBInt16();

    var checksum        = file.UBInt32();
    var design_size     = file.UBInt32() / 1048576;
    var coding_scheme   = file.String(40);
    var family          = file.String(20);

    this.get_char_info = function (index) {
        if (index < bc || index > ec) return {};
        var m = {};
        file.seek(24 + 68 + (index - 1) * 4, "SEEK_SET");
        var wi = file.Byte();
        var hidi = file.Byte();
        var hi = hidi >> 4;
        var di = hidi % 16;
        var iit = file.Byte();
        var ii = iit >> 6;
        var tag = iit % 4;
        var rem = file.Byte();
    };
};
