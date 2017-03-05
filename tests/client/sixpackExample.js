(function () {
    var session = new sixpack.Session();
    function participate() {
        session.participate("test-exp", ["alt-one", "alt-two"], function (err, res) {
            if (err) throw err;
            document.getElementById("participate").innerHTML = JSON.stringify(res);
        });
    };
    function convert() {
        session.convert("test-exp", function (err, res) {
            if (err) throw err;
            document.getElementById("convert").innerHTML = JSON.stringify(res);
        });
    };
})();

