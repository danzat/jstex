if (typeof jstex == "undefined") var jstex = {};

jstex.Stream = function (d) {
    var data = (typeof d == "string") ? d : "";
    var cursor = 0;

    this.length = function () {
        return data.length;
    };

    this.load = function (_d) {
        var data = (typeof _d == "string") ? _d : "";
    };

    this.copy = function (from, length) {
        // TODO: add bound checking for <from> and <length>
        return new jstex.Stream(data.substr(from, length));
    };

    /*
     * Read <n> bytes at the current position in the stream and advance the
     * cursor by the same amount.
     * If the <offset> parameter is specified, read <n> number of bytes at
     * <offset> bytes from the beginning of the stream, but do not change
     * the current cursor position.
     */
    this.read = function (n, offset) {
        if (typeof n == "undefined" || n < 1) {
            n = 1;
        }
        if ((cursor + n) > data.length) {
            throw "Error: Reached EOF";
        }
        var o = [];
        var cur = (typeof offset == "undefined") ? cursor : offset;
        var last = cur + n;
        for (; cur < last; cur++) {
            o.push(data.charCodeAt(cur) % 256);
        }
        if (typeof offset == "undefined") cursor = cur;
        return o;
    };

    this.seek = function (loc, mode) {
        loc = (typeof loc == "undefined") ? 0 : loc;
        mode = (typeof mode == "undefined") ? "SEEK_CUR" : mode;
        if (mode == "SEEK_CUR") {
            cursor += loc;
        } else if (mode == "SEEK_SET") {
            cursor = loc;
        } else {
            throw "Error: Undefined seek mode: " + mode;
        }
    };

    this.eof = function () {
        return cursor == data.length;
    };
        
    this.String = function (n, offset) {
        var _d = this.read(n, offset);
        var s = "";
        for (var i = 0; i < n; i++) {
            s += String.fromCharCode(_d[i]);
        }
        return s;
    };
    
    this.Byte = function (offset) {
        return this.read(1, offset)[0];
    };

    this.UBInt16 = function (offset) {
        var _d = this.read(2, offset);
        return _d[0] * (1 << 8) + _d[1];
    };

    this.UBInt32 = function (offset) {
        var _d = this.read(4, offset);
        return _d[0] * (1<<24) + _d[1] * (1<<16) + _d[2] * (1<<8) + _d[3];
    };
    
    this.SBInt16 = function (offset) {
        var _d = this.UBInt16(offset);
        if ((_d & 0x8000) == 0x8000) {
            return _d | 0xffff0000;
        } else {
            return _d;
        }
    };

    this.SBInt32 = function (offset) {
        var _d = this.UBInt32(offset);
        if ((_d & 0x80000000) == 0x80000000) {
            return _d | 0xffffffff00000000;
        } else {
            return _d;
        }
    };

    this.Fixed32 = function (offset) {
        /* actually returns a float, however, since JS floats are 64 bit, they might have enough percision in them */
        var _r, _l;
        if (typeof offset == "undefined") {
            _r = this.SBInt16();
            _l = this.UBInt16();
        } else {
            _r = this.SBInt16(offset);
            _l = this.UBInt16(offset + 2);
        }
        return _r + _l / 65536.0;
    };
};
