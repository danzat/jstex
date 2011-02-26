if (typeof jstex == "undefined") var jstex = {};

jstex.TTF = function (url) {
    var file = new jstex.XHRFile(url);
    // read the file's main header
    var version         = file.read(4);
    var num_tables      = file.UBInt16();
    var search_range    = file.UBInt16();
    var entry_selector  = file.UBInt16();
    var range_shift     = file.UBInt16();

    // some constants
    var flagOnCurve = 0x01;
    var flagXShort = 0x02;
    var flagYShort = 0x04;
    var flagRepeat = 0x08;
    var flagXSame = 0x10;
    var flagYSame = 0x20;

    // read the various chunk headers
    var chunks = {};
    for (var i = 0; i < num_tables; i++) {
        var chunk = chunks[file.String(4)] = {};
        chunk.checksum = file.UBInt32();
        chunk.offset = file.UBInt32();
        chunk.length = file.UBInt32();
    }

    load_head(chunks['head']);
    load_maxp(chunks['maxp']);
    load_loca(chunks['loca']);
    load_glyf(chunks['glyf']);
    console.debug(chunks);

    function load_head(o) {
        file.seek(o.offset, "SEEK_SET");
        o.version           = file.Fixed32();
        o.revision          = file.Fixed32();
        o.checksum          = file.UBInt32();
        o.magic             = file.read(4);
        o.flags             = file.UBInt16();
        o.unitsPerEm        = file.UBInt16();
        o.created           = file.read(8);
        o.modified          = file.read(8);
        o.xMin              = file.SBInt16();
        o.yMin              = file.SBInt16();
        o.xMax              = file.SBInt16();
        o.yMax              = file.SBInt16();
        o.maxStyle          = file.UBInt16();
        o.lowestRectPPEM    = file.UBInt16();
        o.fontDirectionHint = file.SBInt16();
        o.indexToLocFormat  = file.SBInt16();
        o.glyphDataFormat   = file.SBInt16();
        // TODO: check the checksum
    };

    function load_maxp (o) {
        file.seek(o.offset, "SEEK_SET");
        o.tableVersion  = file.SBInt32();
        o.numGlyphs     = file.UBInt16();
        if (o.tableVersion != 0x00005000) {
            o.maxPoints             = file.UBInt16();
            o.maxContours           = file.UBInt16();
            o.maxCompositePoints    = file.UBInt16();
            o.maxCompositeContours  = file.UBInt16();
            o.maxZones              = file.UBInt16();
            o.maxTwilightPoints     = file.UBInt16();
            o.maxStorage            = file.UBInt16();
            o.maxFunctionDefs       = file.UBInt16();
            o.maxInstructionDefs    = file.UBInt16();
            o.maxStackElements      = file.UBInt16();
            o.maxSizeOfInstruction  = file.UBInt16();
            o.maxComponentElements  = file.UBInt16();
            o.maxComponentDepth     = file.UBInt16();
        }
        // TODO: check the checksum
    };

    function load_loca(o) {
        file.seek(o.offset, "SEEK_SET");
        var longFormat = chunks['head'].indexToLocFormat;
        o.locations = [];
        if (longFormat == 1) {
            for (var i = 0; i < o.length / 4; i++) {
                o.locations.push(file.SBInt32());
            }
        } else {
            for (var i = 0; i < o.length / 2; i++) {
                o.locations.push(2 * file.UBInt16());
            }
        }
        if (o.locations.length < (chunks['maxp'].numGlyphs + 1)) {
            throw "Error: Corrupt 'loca' table or wrong 'numGlyphs' in table 'maxp'";
        }
    };

    function load_glyf (o) {
        file.seek(o.offset, "SEEK_SET");
        o.glyphs = [];
        for (var i = 0; i < chunks['loca'].locations.length - 1; i++) {
            o.glyphs[i] = {};
            load_glyph(o.glyphs[i], chunks['loca'].locations[i] + o.offset);
        }
    };

    this.get_glyph_path = function (i) {
        return chunks['glyf'].glyphs[i].contours;
    };

    this.get_glyph_box = function (i) {
        var g = chunks['glyf'].glyphs[i];
        return {
            xmin: g.xMin,
            xmax: g.xMax,
            ymin: g.yMin,
            ymax: g.yMax
        };
    };
    
    function load_glyph (o, offset) {
        // there are 12 points in 1 em
        var pointsPerUnit = 12 / chunks['head'].unitsPerEm;
        file.seek(offset, "SEEK_SET");
        o.numberOfContours  = file.SBInt16();
        o.xMin              = file.SBInt16() * pointsPerUnit;
        o.yMin              = file.SBInt16() * pointsPerUnit;
        o.xMax              = file.SBInt16() * pointsPerUnit;
        o.yMax              = file.SBInt16() * pointsPerUnit;
        if (o.numberOfContours == -1) {
            throw "Error: loadComponents() not implemented";
        } else {
            var endPointsOfContours = [];
            for (var i = 0; i < o.numberOfContours; i++) {
                endPointsOfContours.push(file.UBInt16());
            }
            var instructionLength = file.UBInt16();
            var instructions = [];
            for (var i = 0; i < instructionLength; i++) {
                instructions.push(file.Byte())
            }
            var nCoordinates = endPointsOfContours[o.numberOfContours - 1] + 1;
            // now we need to extract the flags information to build a specification for reading the x,y coordinate list
            var i = 0;
            var j = 0;
            var xspecs = [];
            var yspecs = [];
            var flags = [];
            var flag;
            var repeat;
            while (j < nCoordinates) {
                flag = file.Byte();
                i++;
                repeat = 1;
                if (flag & flagRepeat) {
                    repeat = file.Byte() + 1;
                    i++;
                }
                for (var k = 0; k < repeat; k++) {
                    if (flag & flagXShort) {
                        xspecs.push('B');
                    } else if (!(flag & flagXSame)) {
                        xspecs.push('h');
                    }
                    if (flag & flagYShort) {
                        yspecs.push('B');
                    } else if (!(flag & flagYSame)) {
                        yspecs.push('h');
                    }
                    flags[j] = flag;
                    j++;
                }
            }
            // load the raw data
            var xCoords = [];
            for (i = 0; i < xspecs.length; i++) {
                if (xspecs[i] == 'B')
                    xCoords.push(file.Byte());
                else /* xspecs[i] == 'h' */
                    xCoords.push(file.SBInt16());
            }
            var yCoords = [];
            for (i = 0; i < yspecs.length; i++) {
                if (yspecs[i] == 'B')
                    yCoords.push(file.Byte());
                else /* xspecs[i] == 'h' */
                    yCoords.push(file.SBInt16());
            }
            // now filter it with the flags information to extract a list of endpoints
            var ix = 0, iy = 0;
            var dx, dy;
            var x = 0, y = 0;
            var coords = [];
            var contours = [];
            var icontour = 0;
            for (var i = 0; i < nCoordinates; i++) {
                flag = flags[i];
                // x coordinate
                if (flag & flagXShort) {
                    if (flag & flagXSame)
                        dx = xCoords[ix];
                    else
                        dx = -xCoords[ix];
                    ix++;
                } else if (flag & flagXSame) {
                    dx = 0;
                } else {
                    dx = xCoords[ix];
                    ix++;
                }
                // y coordinate
                if (flag & flagYShort) {
                    if (flag & flagYSame)
                        dy = yCoords[iy];
                    else
                        dy = -yCoords[iy];
                    iy++;
                } else if (flag & flagYSame) {
                    dy = 0;
                } else {
                    dy = yCoords[iy];
                    iy++;
                }
                x += dx;
                y += dy;
                coords.push({x: x * pointsPerUnit, y: y * pointsPerUnit, q: (flag & flagOnCurve) == flagOnCurve});
                if (i == endPointsOfContours[icontour]) {
                    coords.push(coords[0]);
                    contours.push(coords);
                    icontour++;
                    coords = [];
                }
            }
            o.contours = contours;
        }
    };
};
