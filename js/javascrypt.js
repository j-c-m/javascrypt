/* http://jmiller.mit-license.org/ */

var javascrypt = (function() {

    var javascrypt = function(pubkeyurl, aesurl) {
        this.aeskey = getaeskey();
        this.secure = false;
        this.crypt = new JSEncrypt
        this.scallbacks = [];

        var self = this;

        get(pubkeyurl, function(pubkey) {
            self.crypt.setKey(pubkey);
            post(aesurl, self.crypt.encrypt(self.aeskey), function(content) {
                if (self.aeskey == hex2a(CryptoJS.AES.decrypt(content, self.aeskey))) {
                    self.secure = true;

                    while (self.scallbacks.length > 0) {
                        var callback = self.scallbacks.pop();
                        callback.call(self);
                    }
                    //console.log(self);
                }
            });
        });
    }

    javascrypt.prototype = {
        constructor: javascrypt,
        post: post,
    };
    
    javascrypt.prototype.onsecure = function(callback)
    {        
        if (this.secure === true) {
            callback.call(this);
        } else {
            this.scallbacks.push(function() {
                callback.call(this);
            });
        }
    }
    
    javascrypt.prototype.encryptstr = function(sstring, allow_insecure)
    {
        var self = this;
        
        if (typeof(allow_insecure) == 'undefined') {
            allow_insecure = false;
        }
        
        if (!allow_insecure && this.secure === false) {
            return(false);
        }
        
        if (this.secure === false) {
            return(sstring);
        }
        
        var string = sstring.toString();
        
        return((CryptoJS.AES.encrypt(string, self.aeskey)).toString());
    }

    javascrypt.prototype.encryptform = function(id, allow_insecure) {
        var self = this;
        
        if (typeof(allow_insecure) == 'undefined') {
            allow_insecure = false;
        }

        if (!allow_insecure && this.secure === false) {
            var forms = document.querySelectorAll(id);

            for (var i = 0; i < forms.length; i++) {
                var els = forms[i].querySelectorAll('input[type=submit]');
                for (var e = 0; e < els.length; e++) {
                    els[e].disabled = true;

                }
            }

            this.scallbacks.push(function() {
                this.encryptform(id, allow_insecure)
            });
            return;
        }

        /* renable forms if previously disabled, add submit event */
        var forms = document.querySelectorAll(id);
        for (var i = 0; i < forms.length; i++) {
            var els = forms[i].querySelectorAll('input[type=submit]');
            for (var e = 0; e < els.length; e++) {
                els[e].disabled = false;
            }
            var oldonsubmit;
            if (typeof(forms[i].onsubmit) == 'function') {
                oldonsubmit = forms[i].onsubmit;
            }
            forms[i].onsubmit = function(event) {
                if (typeof(oldonsubmit) == 'function') {
                    oldonsubmit.call(this, event);
                }
                var _javascrypt = document.createElement('input');
                _javascrypt.type = 'hidden';
                _javascrypt.name = '_javascrypt';
                _javascrypt.value = (CryptoJS.AES.encrypt(serialize(this), self.aeskey)).toString();
                for(var x = 0;x < this.elements.length;x++)
                {
                    this[x].disabled = true;
                }
                this.appendChild(_javascrypt);
            };
        }
    }

    function getaeskey() {
        if (typeof(aeskey) != 'undefined') {
            return (aeskey);
        }
        var key;

        if (window.crypto && window.crypto.getRandomValues) {
            var ckey = new Uint32Array(8);
            window.crypto.getRandomValues(ckey);
            key = CryptoJS.lib.WordArray.create(ckey);
        } else {
            key = CryptoJS.lib.WordArray.random(128 / 4);
        }
        return (key.toString());
    }

    function hex2a(hexx) {
        var hex = hexx.toString(); //force conversion
        var str = '';
        for (var i = 0; i < hex.length; i += 2)
            str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        return str;
    }

    /* XMLHttpRequest helpers - no jQuery allowed */

    function getxhr(callback) {
        var xhr;

        if (window.XMLHttpRequest) {
            xhr = new XMLHttpRequest();
        } else {
            xhr = new ActiveXObject("Microsoft.XMLHTTP");
        }

        if (typeof(xhr.onload) != 'undefined') {
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
                callback(xhr.responseText);
            }
        }
    }

    function xhr2onload(xhr, callback) {
        if (typeof(callback) == "function") {
            callback(xhr.responseText);
        }
    }

    function get(url, callback) {
        var xhr = getxhr(callback);
        xhr.open('GET', url);
        xhr.send();
    }

    function post(url, data, callback) {
        var xhr = getxhr(callback);
        xhr.open('POST', url);
        xhr.send(data);
    }
    /* end XMLHttpRequest wrapper section */

    /* Must serialize form w/o jQuery as well */
    /*jslint continue:true*/
    /**
     * Adapted from {@link http://www.bulgaria-web-developers.com/projects/javascript/serialize/}
     * Changes:
     *     Ensures proper URL encoding of name as well as value
     *     Preserves element order
     *     XHTML and JSLint-friendly
     *     Disallows disabled form elements and reset buttons as per HTML4 [successful controls]{@link http://www.w3.org/TR/html401/interact/forms.html#h-17.13.2}
     *         (as used in jQuery). Note: This does not serialize <object>
     *         elements (even those without a declare attribute) or
     *         <input type="file" />, as per jQuery, though it does serialize
     *         the <button>'s (which are potential HTML4 successful controls) unlike jQuery
     * @license MIT/GPL
     */

    function serialize(form) {
        'use strict';
        var i, j, len, jLen, formElement, q = [];

        function urlencode(str) {
            // http://kevin.vanzonneveld.net
            // Tilde should be allowed unescaped in future versions of PHP (as reflected below), but if you want to reflect current
            // PHP behavior, you would need to add ".replace(/~/g, '%7E');" to the following.
            return encodeURIComponent(str).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').
            replace(/\)/g, '%29').replace(/\*/g, '%2A').replace(/%20/g, '+');
        }

        function addNameValue(name, value) {
            q.push(urlencode(name) + '=' + urlencode(value));
        }
        if (!form || !form.nodeName || form.nodeName.toLowerCase() !== 'form') {
            throw 'You must supply a form element';
        }
        for (i = 0, len = form.elements.length; i < len; i++) {
            formElement = form.elements[i];
            if (formElement.name === '' || formElement.disabled) {
                continue;
            }
            switch (formElement.nodeName.toLowerCase()) {
                case 'input':
                    switch (formElement.type) {
                        case 'text':
                        case 'hidden':
                        case 'password':
                        case 'button': // Not submitted when submitting form manually, though jQuery does serialize this and it can be an HTML4 successful control
                        case 'submit':
                            addNameValue(formElement.name, formElement.value);
                            break;
                        case 'checkbox':
                        case 'radio':
                            if (formElement.checked) {
                                addNameValue(formElement.name, formElement.value);
                            }
                            break;
                        case 'file':
                            // addNameValue(formElement.name, formElement.value); // Will work and part of HTML4 "successful controls", but not used in jQuery
                            break;
                        case 'reset':
                            break;
                    }
                    break;
                case 'textarea':
                    addNameValue(formElement.name, formElement.value);
                    break;
                case 'select':
                    switch (formElement.type) {
                        case 'select-one':
                            addNameValue(formElement.name, formElement.value);
                            break;
                        case 'select-multiple':
                            for (j = 0, jLen = formElement.options.length; j < jLen; j++) {
                                if (formElement.options[j].selected) {
                                    addNameValue(formElement.name, formElement.options[j].value);
                                }
                            }
                            break;
                    }
                    break;
                case 'button': // jQuery does not submit these, though it is an HTML4 successful control
                    switch (formElement.type) {
                        case 'reset':
                        case 'submit':
                        case 'button':
                            addNameValue(formElement.name, formElement.value);
                            break;
                    }
                    break;
            }
        }
        return q.join('&');
    }
    /* end serialize section */
    return javascrypt;
}());