if (typeof jstex == "undefined") var jstex = {};

jstex.XHRFile = function (url) {
    this.prototype = new jstex.Stream();
    this.prototype.constructor = this;
    if (url != "") {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, false);
        xhr.overrideMimeType('text/plain; charset=x-user-defined');
        xhr.send(null);
        jstex.Stream.call(this, xhr.responseText);
    } else {
        jstex.Stream.call(this);
    }
};
