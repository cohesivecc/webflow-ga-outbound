/*
 * Webflow GA Outbound: Webflow-friendly Google Analytics event tracking for clicks on outbound links and files.
 * @license MIT
 * @author Neal White - http://www.cohesive.cc
 *
 * https://github.com/cohesivecc/webflow-ga-outbound
 */

var Webflow = Webflow || [];
Webflow.push(function() {
  window.OutboundLink = {
    options: {
      selector: 'a[href]',
      domain_whitelist: [location.hostname],
      extension_whitelist: ['html', 'xml', 'asp', 'php']
    },
    regExp: null,

    // Initialize the library, listen for clicks
    initialize: function() {
      if (typeof jQuery != 'function') {
        throw 'jQuery is required for OutboundLink.';
        return false;
      }
      if (typeof window._gaq != 'object' && typeof window.ga != 'function') {
        throw 'Google Analytics is required for OutboundLink.';
        return false;
      }
      OutboundLink.updateRegexp();
      OutboundLink.listen();
    },

    // Compose the regex from the whitelisted domains
    updateRegexp: function() {
      var urls = $.map(OutboundLink.options.domain_whitelist, function(s, i) {
        return s.replace(/\./g, '\\.');
      });
      OutboundLink.regExp = new RegExp(
        '^https?://(' + urls.join('|') + ')',
        'i'
      );
    },

    // Whitelist a domains (or array of domains)
    whitelistDomain: function(d) {
      if (typeof domains === 'string') {
        domains = [domains];
      }
      $.each(domains, function(i, d) {
        if ($.inArray(OutboundLink.options.domain_whitelist, d) < 0) {
          OutboundLink.options.domain_whitelist.push(d);
        }
      });
      OutboundLink.updateRegexp();
    },

    // Whitelist additional file extensions
    whitelistFileExtension: function(ext) {
      if (typeof ext === 'string') {
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
      var basename = url
        .replace(/^(https?:)?\/\/[^\/]*/, '')
        .split('/')
        .pop()
        .replace(/[\?\#](.+)?$/i, '');
      var parts = basename.split('.');
      if (parts.length > 1) {
        var ext = parts.pop();
        if (
          $.trim(ext) != '' &&
          $.inArray(OutboundLink.options.extension_whitelist, ext) < 0
        ) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    },

    // Pause listener
    pause: function() {
      $(document).off(
        'click touch',
        OutboundLink.options.selector,
        OutboundLink.handleClick
      );
    },

    // Listen for link clicks
    listen: function() {
      OutboundLink.pause();
      $(document).on(
        'click touch',
        OutboundLink.options.selector,
        OutboundLink.handleClick
      );
    },

    // link clicked
    handleClick: function(e) {
      var href = e.currentTarget.href;
      var evt = null;
      try {
        if (window.ga) {
          evt = {
            hitType: 'event',
            eventCategory: 'Outbound Click',
            eventLabel: href,
            hitCallback: null
          };
          if (OutboundLink.isFile(href)) {
            evt.eventAction = 'File';
          } else if (OutboundLink.isOutbound(href)) {
            evt.eventAction = 'Link';
          }
          if (evt) {
            // if it doesn't open in a new window, don't navigate until after GA tracks the click.
            if ($.trim(e.currentTarget.target) == '') {
              e.preventDefault();
              e.stopPropagation();

              evt.hitCallback = function() {
                document.location = href;
              };
            }
            if ('ga' in window) {
              tracker = ga.getAll()[0];
              if (tracker) {
                tracker.send('send', evt);
              }
            } else {
              if (ga('send', evt) === undefined) {
                document.location = href;
              }
            }
          }
        } else {
          // old version of Google Analytics
          if (OutboundLink.isFile(href)) {
            evt = ['_trackEvent', 'Outbound Click', 'File', href];
          } else if (OutboundLink.isOutbound(href)) {
            evt = ['_trackEvent', 'Outbound Click', 'Link', href];
          }
          if (evt) {
            // if it doesn't open in a new window, don't navigate until after GA tracks the click.
            if ($.trim(e.currentTarget.target) == '') {
              e.preventDefault();
              e.stopPropagation();
              _gaq.push([
                '_set',
                'hitCallback',
                function() {
                  document.location = href;
                }
              ]);
            }
            _gaq.push(evt);
          }
        }
      } catch (e) {
        document.location = href;
      }
    }
  };
  OutboundLink.initialize();
});
