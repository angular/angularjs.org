/**
 * Application controller for the entire page
 */
function AppCtrl($location) {
  var scope = this;

  scope.angular = {version: '0.9.16', name: 'weather-control'};

  //normalize hash, set subpage and track page view
  scope.$watch(function() { return $location.hash; }, function() {
    var hash = $location.hash;

    if (hash == '/' || hash == '/downloads' || hash == '/community') {
      scope.subpage = hash.substring(1);
      _gaq.push(['_trackPageview', hash]);
    } else {
      $location.hash = '/';
    }
  });
}


/**
 * Testimonials controller
 *
 * @returns {TestimonialsCtrl}
 */
function TestimonialsCtrl() {
  this.loadOpinion_(0);
}

TestimonialsCtrl.prototype = {

  /**
   * Display the previous testimonial
   */
  previous: function() {
    if (this.selected_ == 0)
      this.loadOpinion_(this.TESTIMONIALS.length - 1);
    else
      this.loadOpinion_(this.selected_ - 1);
  },

  /**
   * Display the next testimonial
   */
  next: function() {
    this.loadOpinion_((this.selected_ + 1) % this.TESTIMONIALS.length);
  },

  /**
   * Load opinion with given index and truncate the content if necessary
   * @param {Number} index
   */
  loadOpinion_: function(index) {
    this.selected_ = index;
    var opinion = this.TESTIMONIALS[index];
    if (opinion.content.length > 380) {
      this.content = opinion.content.substr(0, 356);
      this.isOpen = false;
    } else {
      this.content = opinion.content;
      this.isOpen = true;
    }
    this.name = opinion.name;
    this.resetTimer_();
  },

  /**
   * Reset timer = clear old timeout and set new one
   */
  resetTimer_: function() {
    if (this.timer_) {
      clearTimeout(this.timer_);
    }

    var self = this;
    this.timer_ = setTimeout(function() {
      self.next();
      self.$eval();
    }, 20000);
  },

  /**
   * Unfold current opinion
   */
  open: function() {
    this.isOpen = true;
    this.content = this.TESTIMONIALS[this.selected_].content;
  },

  /**
   * Array of testimonials
   */
  TESTIMONIALS: [{
    name: 'John Hardy',
    content: 'I\'m currently rewriting a server-side web application to use this system. I am constantly astounded at how much simpler it is to do it this way and I still consider myself a learner.' +
      'This is without question the most productive approach to building webapps that I have seen. ' +
      'The last time I had a coding epiphany was discovering the power and simplicity of JQuery. This is way better than that.' +
      'I\'m interested in promoting this library as widely as possible. I understand that you are still developing it and I still have a long way to go before I really understand everything but I think you really have something here.'
  }, {
    name: 'Jerry Jeremiah',
    content: 'Angular is the best thing I have used in a long time. I am having so much fun, even thought it is probably obvious that dynamic web sites are new to me (my experience is more in the back end embedded world...)'
  }, {
    name: 'Dobrica Pavlinusic',
    content: 'Thanks to great help I received at this list, I was basically able to accomplish my goal to write simple conference submission application within a week of first git clone of angular source from github.' +
      'I think it might be useful to summarize my experience here, especially for people who are still wondering if angular is worth a try. Executive summary is: yes it is !'
  }, {
    name: 'Tobias Bosch',
    content: 'Angular is great work, thank you! I found it while I was writing an own client side templating system using custom html tags, but didn\'t know how to figure out a good way to implement data binding. I definitely think that this is a great way to go.'
  }]
};

/**
 * Live Examples Controller
 *
 * @returns {ExamplesCtrl}
 */
function ExamplesCtrl() {
  SyntaxHighlighter.highlight();
  this.selected = 0;
}

ExamplesCtrl.prototype = {
  previous: function() {
    this.next();
  },
  next: function() {
    this.selected = (this.selected + 1) % 2;
  },
  examples: [{title: 'Password', description: 'The following is a demo password generator app that showcases angular\'s rich declarative templates, data-binding, MVC, xhr service, and depenency injection.'},
             {title: 'Invoice', description: 'The following is a demo invoicing app built only with angular\'s declarative templates, data-binding, filters, and validators.'}]
};

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
