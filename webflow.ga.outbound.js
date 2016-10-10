/*
 * Webflow GA Outbound: Webflow-friendly Google Analytics event tracking for clicks on outbound links and files.
 * @license MIT
 * @author Neal White - http://www.cohesive.cc
*/


var Webflow = Webflow || [];
Webflow.push(function () {

  var OutboundLink = {
    options: {
      selector: 'a',
      domain_whitelist: [location.hostname],
      extension_whitelist: ['html', 'xml', 'asp', 'php']
    },
    regExp: null,

    // Initialize the library, listen for clicks
    initialize: function() {
      if(typeof(jQuery) != 'function') {
        throw("jQuery is required for OutboundLink.");
        return false;
      }
      if(typeof(window._gaq) != 'object') {
        throw("Google Analytics is required for OutboundLink.")
        return false;
      }
      OutboundLink.updateRegexp();
      OutboundLink.listen();
    },

    // Compose the regex from the whitelisted domains
    updateRegexp: function() {
      var urls = $.map(OutboundLink.options.domain_whitelist, function(s, i) {
                    return s.replace(new RegExp(/\./, 'g'), "\\.");
                  });
      OutboundLink.regExp = new RegExp("^https?:\/\/(" + urls.join('|') + ")", "i");
    },

    // Whitelist a domains (or array of domains)
    whitelistDomain: function(d) {
      if(typeof(domains) === 'string') {
        domains = [domains];
      }
      $.each(domains, function(i, d) {
        if($.inArray(OutboundLink.options.domain_whitelist, d) < 0) {
          OutboundLink.options.domain_whitelist.push(d);
        }
      });
      OutboundLink.updateRegexp();
    },

    // Whitelist additional file extensions
    whitelistFileExtension: function(ext) {
      if(typeof(ext) === 'string') {
        ext = [ext];
      }
      $.merge(OutboundLink.options.extension_whitelist, ext);
      $.unique(OutboundLink.options.extension_whitelist);
    },

    // test a URL against the regex to determine if it's outbound or not
    isOutbound: function(url) {
      return !OutboundLink.regExp.test(url);
    },

    isFile: function(url) {
      // remove the domain portion of the url, split by '/' and take the last one, strip off query params, split by '.', take last element
      var ext = url.replace(/^(https?:)?\/\/[^\/]*/, '').split('/').pop().replace(/[\?\#](.+)?$/i, "").split('.').pop()
      if($.trim(ext) != '' && $.inArray(OutboundLink.options.extension_whitelist, ext) < 0) {
        return true;
      } else {
        return false;
      }
    },

    // Pause listener
    pause: function() {
      $(document).off('click touch', OutboundLink.options.selector, OutboundLink.handleClick);
    },

    // Listen for link clicks
    listen: function() {
      OutboundLink.pause();
      $(document).on('click touch', OutboundLink.options.selector, OutboundLink.handleClick);
    },

    // link clicked
    handleClick: function(e) {
      var href = e.target.href;
      var evt = null;
      if(OutboundLink.isFile(href)) {
        evt = [
          '_trackEvent',
          'Outbound Click',
          'File',
          href
        ];
      } else if(OutboundLink.isOutbound(href)) {
        evt = [
          '_trackEvent',
          'Outbound Click',
          'Link',
          href
        ];
      }
      if(evt) {
        // if it doesn't open in a new window, don't navigate until after GA tracks the click.
        if($.trim(e.target.target) == '') {
          e.preventDefault();
          e.stopPropagation();
          _gaq.push(['_set','hitCallback', function() { document.location = href; }])
        }
        _gaq.push(evt);
      }
    }

  }
  OutboundLink.initialize();
});
