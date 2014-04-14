/* http://jmiller.mit-license.org/ */

var javascrypt = (function() {
    var my = {};
    
    var publickey, aeskey;

    
    /* XMLHttpRequest helpers - no jQuery allowed */
    function getxhr(callback) {
        var xhr;

        if (window.XMLHttpRequest) {
            xhr = new XMLHttpRequest();
        } else {
            xhr = new ActiveXObject("Microsoft.XMLHTTP");
        }

        if (xhr.onload) {
            xhr.onload = function() {
                xhr2onload(xhr, callback);
            }
        } else {
            xhr.onreadystatechange = function() {
                xhrstatechange(xhr, callback);
            }
        }

        return xhr;
    }

    function xhrstatechange(xhr, callback) {
        if (xhr.readyState == 4 && xhr.status == 200) {
            if (typeof(callback) == "function") {
                callback(JSON.parse(xhr.responseText));
            }
        }
    }

    function xhr2onload(xhr, callback) {
        if (typeof(callback) == "function") {
            callback(JSON.parse(xhr.responseText));
        }
    }

    function getJSON(url, callback) {
        var xhr = getxhr(callback);
        xhr.open('GET', url);
        xhr.send();
    }

    function postJSON(url, data, callback) {
        var xhr = getxhr(callback);
        xhr.open('POST', url);
        xhr.setRequestHeader('Content-Type', 'application/json')
        xhr.send(JSON.stringify(data));
    }
    /* end XMLHttpRequest wrapper section */
    
    

    return my;
}());