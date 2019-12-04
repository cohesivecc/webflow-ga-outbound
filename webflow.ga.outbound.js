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
      extension_whitelist: [
        'html', 'htm', 'xhtml', 'jhtml', 'shtml', 
        'asp', 'aspx', 'axd', 'asx', 'asmx', 'ashx', 'cgi', 'dll',
        'cfm', 'yaws',
        'php', 'php4', 'php3', 'phtml', 'py',
        'jsp', 'jspx', 'wss', 'do', 'action',
        'xml', 'rss', 'atom'
      ]
    },
    regExp: null,
    GAVersion: null,

    // Initialize the library, listen for clicks
    initialize: function() {
      if (typeof jQuery != 'function') {
        throw 'jQuery is required for OutboundLink.';
        return false;
      }

      OutboundLink.setGAVersion();
      if (!OutboundLink.GAVersion) {
        throw 'Google Analytics is required for OutboundLink.';
        return false;
      } 
      
      OutboundLink.updateRegexp();
      OutboundLink.listen();
    },

    // set GA version
    setGAVersion: function() {
      // typeof window._gaq != 'object' && typeof window.ga != 'function' && typeof window.gtag != 'function'
      if(typeof window.gtag == 'function') {
        OutboundLink.GAVersion = 'gtag'
      } else if(typeof window.ga == 'function') {
        OutboundLink.GAVersion = 'ga'
      } else if(typeof window._gaq == 'object') {
        OutboundLink.GAVersion = '_gaq'
      }      
    },

    sendEvent: function(action, category, label, hitCallback) {
      switch(OutboundLink.GAVersion) {
        case 'gtag':
          gtag('event', action, {
            'event_category': category,
            'event_label': label,
            'event_callback': hitCallback
          });
          break;
        case 'ga':
          ga('send', {
            hitType: 'event',
            eventAction: action,
            eventCategory: category,
            eventLabel: label,
            hitCallback: hitCallback
          })
          break;
        case '_gaq':
          if(hitCallback) {
            _gaq.push([
              '_set',
              'hitCallback',
              hitCallback
            ]);
          }
          _gaq.push(['_trackEvent', category, action, label, undefined]);
          break;
        default:
          break;
      }
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
      
      var m = url
        .replace(/[\?\#](.+)?$/i, '')
        .replace(/^(https?:)?\/\/[^\/]*/, '')
        .match(/\.([0-9a-z]+)$/i)
      
      return !!(m && m[1] && $.inArray(OutboundLink.options.extension_whitelist, m[1]) < 0)
      
    },

    getTypeForURL: function(url) {
      if(OutboundLink.isFile(url)) {
        return 'File';
      } else if(OutboundLink.isOutbound(url)) {
        return 'Link';
      } else {
        return null;
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
      var action = OutboundLink.getTypeForURL(e.currentTarget.href)

      if(action) {

        var callback = null
        // if it doesn't open in a new window, don't navigate until after GA tracks the click.
        if($.trim(e.currentTarget.target) == '') {
          e.preventDefault();
          e.stopPropagation();
          callback = function() {
            document.location = e.currentTarget.href;
          }
        }

        OutboundLink.sendEvent(action, 'Outbound Click', e.currentTarget.href, callback)
      } else {
        return true;
      }
    }
  };
  OutboundLink.initialize();
});
