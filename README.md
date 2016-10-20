## Webflow + Google Analytics + Outbound Links and Files

This library provides a drop-in solution for logging clicks (as Events in Google Analytics) on outbound links and files from within a Webflow site.

This script listens for any clicks on your site's links, tests the ```href``` value for either a file extension or a URL outside of your site's domain, and if necessary creates a custom event for the older version of Google Analytics. This code is wrapped inside [Webflow's event queue](https://forum.webflow.com/t/webflow-js-and-jquery-plugins/907) to ensure compatibility.

### Usage

Simply upload ```webflow.ga.outbound.js``` to your server, and include it via script tag in the Custom Code section of your site in Webflow:

```<script src="/webflow.ga.outbound.js" type="text/javascript"></script>```

### Customizing

You can 'whitelist' additional domains and file extensions that you want this script to ignore (ie. not track events for). Be sure to do this **after** you've included the ```webflow.ga.outbound.js``` script.

Remember, this is basically saying "any links to these URLs or these file types are **NOT** to be tracked as outbound."

```javascript
var Webflow = Webflow || [];
Webflow.push(function () {
  OutboundLink.whitelistDomain(['staging.mysite.com', 'google.com']);
  OutboundLink.whitelistFileExtension(['zip', 'doc']);
});
```

### License
This library is licensed under the [MIT License](http://www.opensource.org/licenses/MIT).
