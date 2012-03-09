/**
 * Application controller for the entire page
 */
function AppCtrl($scope, $location) {
  $scope.angular = {version: '1.0.0_rc1', name: 'moiré-vision'};

  //normalize hash, set subpage and track page view
  $scope.$watch(function() { return $location.path(); }, function(hash) {
    if (hash == '/' || hash == '/downloads' || hash == '/community') {
      $scope.subpage = hash.substring(1);
      _gaq.push(['_trackPageview', hash]);
    } else {
      $location.path('/');
    }
  });
}


/**
 * Testimonials controller
 *
 * @returns {TestimonialsCtrl}
 */
function TestimonialsCtrl($scope, $defer) {
  var timer_;
  /**
   * Array of testimonials
   */
  $scope.TESTIMONIALS = [
    { name: 'Ray Camden', // http://www.coldfusionjedi.com/
      content: 'I am simply blown away. ... the tutorials themselves are doing a great job ' +
        'introducing new concepts and - frankly - making me excited about using the ' +
        'platform. I haven\'t been this excited since I got into jQuery.' },
    { name: 'John Hardy',
      content: 'I\'m currently rewriting a server-side web application to use this system. I am constantly astounded at how much simpler it is to do it this way and I still consider myself a learner.' +
        'This is without question the most productive approach to building webapps that I have seen. ' +
        'The last time I had a coding epiphany was discovering the power and simplicity of JQuery. This is way better than that.' +
        'I\'m interested in promoting this library as widely as possible. I understand that you are still developing it and I still have a long way to go before I really understand everything but I think you really have something here.' }, 
    { name: 'Jerry Jeremiah',
      content: 'Angular is the best thing I have used in a long time. I am having so much fun, even thought it is probably obvious that dynamic web sites are new to me (my experience is more in the back end embedded world...)' }, 
    { name: 'Dobrica Pavlinusic',
      content: 'Thanks to great help I received at this list, I was basically able to accomplish my goal to write simple conference submission application within a week of first git clone of angular source from github.' +
        'I think it might be useful to summarize my experience here, especially for people who are still wondering if angular is worth a try. Executive summary is: yes it is !' },
    { name: 'Tobias Bosch',
      content: 'Angular is great work, thank you! I found it while I was writing an own client side templating system using custom html tags, but didn\'t know how to figure out a good way to implement data binding. I definitely think that this is a great way to go.'},
    { name: 'Johan Steenkamp',
      content: 'For me, Angular these days is to web development, what jQuery was to JavaScript.' }
  ];

  $scope.previous = function() {
    if ($scope.selected_ == 0)
      loadOpinion($scope.TESTIMONIALS.length - 1);
    else
      loadOpinion($scope.selected_ - 1);
  };

  /**
   * Display the next testimonial
   */
  $scope.next = function() {
    loadOpinion(($scope.selected_ + 1) % $scope.TESTIMONIALS.length);
  };

  /**
   * Load opinion with given index and truncate the content if necessary
   * @param {Number} index
   */
  function loadOpinion(index) {
    $scope.selected_ = index;
    var opinion = $scope.TESTIMONIALS[index];
    if (opinion.content.length > 380) {
      $scope.content = opinion.content.substr(0, 356);
      $scope.isOpen = false;
    } else {
      $scope.content = opinion.content;
      $scope.isOpen = true;
    }
    $scope.name = opinion.name;
    resetTimer();
  }

  /**
   * Reset timer = clear old timeout and set new one
   */
  function resetTimer() {
    if (timer_) {
      $defer.cancel(timer_);
    }

    timer_ = $defer($scope.next, 20000);
  }

  /**
   * Unfold current opinion
   */
  $scope.open = function() {
    $scope.isOpen = true;
    $scope.content = $scope.TESTIMONIALS[$scope.selected_].content;
  };

  loadOpinion(0);
}

/**
 * Live Examples Controller
 *
 * @returns {ExamplesCtrl}
 */
function ExamplesCtrl($scope) {
  SyntaxHighlighter.highlight();


  $scope.selected = 0;

  $scope.examples = [
    {title: 'Password', description: 'The following is a demo password generator app that showcases angular\'s rich declarative templates, data-binding, MVC, xhr service, and depenency injection.'},
    {title: 'Invoice', description: 'The following is a demo invoicing app built only with angular\'s declarative templates, data-binding, filters, and validators.'}
  ];


  $scope.previous = function() {
    $scope.selected = Math.max(0, $scope.selected - 1);
  }

  $scope.next = function() {
    $scope.selected = Math.min($scope.examples.length - 1, $scope.selected + 1);
  }
}

// syntax highlighter defaults
SyntaxHighlighter.defaults['html-script'] = true;
SyntaxHighlighter.defaults['toolbar'] = false;
SyntaxHighlighter.defaults['gutter'] = false;

// bind escape to hash reset callback
// hash is reset to '/' to prevent scrolling up which happens when hash is set to ''
angular.element(window).bind('keydown', function(e) {
  if (e.keyCode === 27) {
    window.location.hash = '/';
  }
});

// load twitter widget
$script.ready('twitter', function() {
  new TWTR.Widget({
    id: 'twitterWidget',
    version: 2,
    type: 'profile',
    rpp: 3,
    interval: 6000,
    width: 250,
    height: 250,
    theme: {
      shell: {
        background: '#333333',
        color: '#ffffff'
      },
      tweets: {
        background: '#000000',
        color: '#ffffff',
        links: '#a6ccf5'
      }
    },
    features: {
      scrollbar: false,
      loop: false,
      live: false,
      hashtags: true,
      timestamp: true,
      avatars: false,
      behavior: 'all'
    }
  }).render().setUser('angularjs').start();
});
