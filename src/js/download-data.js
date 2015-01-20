angular.module('download-data', [])

.value('BRANCHES', [
    {
      branch: '1.3.*', version: '${CDN_VERSION_1_3}',
      title: '1.3.x (stable)',
      cssClass: 'branch-1-3-x'
    },
    {
      branch: '1.4.*', version: '${CDN_VERSION_1_4}',
      title: '1.4.x (latest)',
      cssClass: 'branch-1-4-x'
    }
])

.value('BUILDS', [
    { name: 'Minified' },
    { name: 'Uncompressed' },
    { name: 'Zip' }
])

.value('DOWNLOAD_INFO', {
  branchesInfo:
    "<dl class='dl-horizontal'>"+
    "  <dt>Latest 1.4.x</dt>"+
    "  <dd>This branch is the actively-developed feature branch (<a href='https://github.com/angular/angular.js/tree/master' target='_blank'>master on Github</a>), not yet considered stable.</dd>"+
    "  <dt>Stable 1.3.x</dt>"+
    "  <dd>This is the latest stable branch (<a href='https://github.com/angular/angular.js/tree/v1.3.x' target='_blank'>v1.3.x on Github</a>), with regular bug fixes, performance improvements and small features added.</dd>"+
    "</dl>",

  buildsInfo:
    "<dl class='dl-horizontal'>"+
    "  <dt>Minified</dt>"+
    "  <dd>Minified and obfuscated version of the AngularJS base code. Use this in your deployed application (but only if you can't use Google's CDN)</dd>"+
    "  <dt>Uncompressed</dt>"+
    "  <dd>The main AngularJS source code, as is. Useful for debugging and development purpose, but should ideally not be used in your deployed application</dd>"+
    "  <dt>Zipped</dt>"+
    "  <dd>The zipped version of the Angular Build, which contains both the builds of AngularJS, as well as documentation and other extras</dd>"+
    "</dl>",

  cdnInfo:
    "While downloading and using the AngularJS source code is great for development, "+
    "we recommend that you source the script from Google's CDN (Content Delivery Network) in your deployed, customer facing app whenever possible. "+
    "You get the following advantages for doing so:"+
    "<ul>"+
    "  <li><strong>Better Caching :</strong> If you host AngularJS yourself, your users will have to download the source code atleast once. But if the browser sees that you are referring to Google CDN's version of AngularJS, and your user has visited another app which uses AngularJS, then he can avail the benefits of caching, and thus reduce one download, speeding up his overall experience!</li>"+
    "  <li><strong>Decreased Latency :</strong> Google's CDN distributes your static content across the globe, in various diverse, physical locations. It increases the odds that the user gets a version of AngularJS served from a location near him, thus reducing overall latency.</li>"+
    "  <li><strong>Increased Parallelism : </strong>Using Google's CDN reduces one request to your domain. Depending on the browser, the number of parallel requests it can make to a domain is restricted (as low as 2 in IE 7). So it can make a gigantic difference in loading times for users of those browsers.</li>"+
    "</ul>",

  bowerInfo:
    "Bower is a package manager for client-side JavaScript components.<br><br>"+
    "For more info please see: <a href='https://github.com/bower/bower'>https://github.com/bower/bower</a>"
});
