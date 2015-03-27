(function($, acf) {
/* **********************************************
     Begin address-map.js
********************************************** */

	acf.fields.address_map = {

		$el: null,
		$input: null,
		o: {},
		ready: false,
		geocoder: false,
		map: false,
		maps: {},

		set: function(o) {
			// merge in new option
			$.extend(this, o);
			// find input
			this.$input = this.$el.find('.value');
			// get options
			this.o = acf.helpers.get_atts(this.$el);
			// get map
			if (this.maps[this.o.id]) {
				this.map = this.maps[this.o.id];
			}
			// return this for chaining
			return this;
		},

		init: function() {
			// geocode
			if (!this.geocoder) {
				this.geocoder = new google.maps.Geocoder();
			}
			// google maps is loaded and ready
			this.ready = true;
			// is clone field?
			if (acf.helpers.is_clone_field(this.$input)) {
				return;
			}
			this.render();
		},

		render: function() {
			// reference
			var _this = this;

			// vars
			var args = {
				zoom: parseInt(_this.o.zoom),
				center: new google.maps.LatLng(_this.o.lat, _this.o.lng),
				mapTypeId: google.maps.MapTypeId.ROADMAP
			};

			// create map	        	
			_this.map = new google.maps.Map(_this.$el.find('.canvas')[0], args);

			// add dummy marker
			_this.map.marker = new google.maps.Marker({
				draggable: true,
				raiseOnDrag: true,
				map: _this.map
			});

			// add references
			_this.map.$el = _this.$el;

			// lat/lng exists?
			var lat = _this.$el.find('.latitude').val(),
				lng = _this.$el.find('.longitude').val();

			if (lat && lng) {
				_this.update(lat, lng).center();
        if(!_this.$el.find('.search').val()) _this.sync();
			} else if(_this.$el.find('.search').val() != '') {
        // No lat/lng but there is a geolocatable search string so we're importing then
        _this.search(_this.$el.find('.search').val());
      }
			
			if(_this.$el.find('.search').val() == ''){
				_this.$el.removeClass('active');
			}

      // add search
      var autocomplete = new google.maps.places.Autocomplete(_this.$el.find('.search')[0]);

      autocomplete.map = _this.map;
      autocomplete.bindTo('bounds', _this.map);

			google.maps.event.addListener(autocomplete, 'place_changed', function(e) {
        _this.search(autocomplete.getPlace());
			});

			google.maps.event.addListener(this.map.marker, 'dragend', function() {
				var position = _this.map.marker.getPosition();

				_this.set({$el: _this.map.$el}).update(position.lat(), position.lng()).sync();
			});
			google.maps.event.addListener(this.map, 'click', function(e) {
        var position = e.latLng;

        _this.set({$el: _this.$el}).update(position.lat(), position.lng()).sync();
			});

			// add to maps
			this.maps[this.o.id] = this.map;
		},

    search: function(place){
      var _this = this;
      console.log('Searching:', place);
      _this.resolve(place, function(place) {
        _this.update_fields(new acf.fields.address_map.Address(place));
        var mapName = _this.$el.find('.search').val();
        _this.$el.find('.title h4').text(mapName);
        _this.$el.find('.input-address').val(mapName).trigger('change');
      });
    },

    /**
     *
     * @param {acf.fields.address_map.Address} address
     */
    update_fields: function(address) {
      if(address.name !== false) this.$el.find('.business_name').val(address.name);
      if(address.phone !== false) this.$el.find('.phone').val(address.phone);
      if(address.website !== false) this.$el.find('.website').val(address.website);
      this.$el.find('.address_one').val(address.address_line_1);
      this.$el.find('.address_two').val(address.address_line_2);
      this.$el.find('.city').val(address.city);
      this.$el.find('.state').val(address.state);
      this.$el.find('.country').val(address.country);
      this.$el.find('.zip').val(address.zip);
      this.$el.find('.latitude').val(address.lat);
      this.$el.find('.longitude').val(address.lng);
      this.$el.find('input.google-map').val(address.url);

      if(address.lat != 0 && address.lng != 0) this.set({$el: this.$el}).update(address.lat, address.lng).center();
    },

    resolve: function(place, cb){
      if(typeof cb != 'function') cb = function(){};

      var _this = this;

      if(typeof place == 'string') place = {name: place};

      if(typeof place == 'object' && typeof place.geometry != 'object' && _this.geocoder) {
        // client hit enter, manulaly get the place
        _this.geocoder.geocode({
          'address': place.name
        }, function(results, status) {
          if (status != google.maps.GeocoderStatus.OK) {
            if(status == google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
              alert("You're going to fast! Try again in a few seconds.");
            } else {
              alert("An unknown error occurred when communicating with Google Maps.");
            }
            return;
          }
          if(results.length == 0) {
            alert("No results found for the address you entered.");
            return;
          }
          cb(results[0]);
        });
      } else {
        cb(place);
      }
      return _this;
    },

		update: function(lat, lng) {
			// vars
			var latlng = new google.maps.LatLng(lat, lng);
			// update inputs
			this.$el.find('.input-lat').val(lat);
			this.$el.find('.input-lng').val(lng).trigger('change');
			this.$el.find('.latitude').val(lat);
			this.$el.find('.longitude').val(lng);
			// update marker
			this.map.marker.setPosition(latlng);
			// show marker
			this.map.marker.setVisible(true);
			// update class
			this.$el.addClass('active');
			// validation
			this.$el.closest('.field').removeClass('error');
			// return for chaining
			return this;
		},

		center: function() {
			// vars
			var position = this.map.marker.getPosition(),
				lat = this.o.lat,
				lng = this.o.lng;
			// if marker exists, center on the marker
			if (position) {
				lat = position.lat();
				lng = position.lng();
			}
			var latlng = new google.maps.LatLng(lat, lng);
			// set center of map
			this.map.setCenter(latlng);
		},

		sync: function() {
      var _this = this;

			var position = _this.map.marker.getPosition(),
				latlng = new google.maps.LatLng(position.lat(), position.lng());

      // Reverse geocode
			_this.geocoder.geocode({
				'latLng': latlng
			}, function(results, status) {
        if (status != google.maps.GeocoderStatus.OK) {
          if(status == google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
            alert("You're going to fast! Try again in a few seconds.");
          } else {
            alert("An unknown error occurred when communicating with Google Maps.");
          }
          return;
        }
        if(results.length == 0) {
          alert("No results found for the address you entered.");
          return;
        }

        var place = results[0];
        _this.update_fields(new acf.fields.address_map.Address(place));
        _this.$el.find('.title h4').text(place.formatted_address);
        _this.$el.find('.input-address').val(place.formatted_address).trigger('change');
			});

			return this;
		},

		locate: function() {
			// reference
			var _this = this,
				_$el = this.$el;
			// Try HTML5 geolocation
			if (!navigator.geolocation) {
				alert(acf.l10n.address_map.browser_support);
				return this;
			}
			// show loading text
			_$el.find('.title h4').text(acf.l10n.address_map.locating + '...');
			_$el.addClass('active');
			navigator.geolocation.getCurrentPosition(function(position) {
				// vars
				var lat = position.coords.latitude,
					lng = position.coords.longitude;
				_this.set({
					$el: _$el
				}).update(lat, lng).sync();
			});
		},

		clear: function() {
			// update class
			this.$el.removeClass('active');
			// clear search
			this.$el.find('.search').val('');
			// clear inputs
			this.$el.find('.input-address').val('');
			this.$el.find('.input-lat').val('');
			this.$el.find('.input-lng').val('');
			// hide marker
			this.map.marker.setVisible(false);
		},

		edit: function() {
			// update class
			this.$el.removeClass('active');
			// clear search
			var val = this.$el.find('.title h4').text();
			this.$el.find('.search').val(val).focus();
		},

		refresh: function() {
			// trigger resize on div
			google.maps.event.trigger(this.map, 'resize');
			// center map
			this.center();
		}
	};


  /**
   * Represents an address
   * @constructor
   * @param {google.maps.places.PlaceResult} place
   */
  acf.fields.address_map.Address = function(place){
    if(typeof place == 'string') place = {name: place};
    this.parse(place);
  };

  acf.fields.address_map.Address.input_map = {
    street_number: {
      to: 'number',
      use: 'long_name'
    },
    subpremise: {
      to: 'unit',
      use: 'long_name'
    },
    route: {
      to: 'street',
      use: 'long_name'
    },
    locality: {
      to: 'city',
      use: 'long_name'
    },
    country: {
      to: 'country',
      use: 'long_name'
    },
    administrative_area_level_1: {
      to: 'state',
      use: 'short_name'
    },
    postal_code: {
      to: 'zip',
      use: 'long_name'
    }
  };

  acf.fields.address_map.Address.prototype.okay = false;

  acf.fields.address_map.Address.prototype.name = false;
  acf.fields.address_map.Address.prototype.phone = false;
  acf.fields.address_map.Address.prototype.website = false;
  acf.fields.address_map.Address.prototype.address_line_1 = '';
  acf.fields.address_map.Address.prototype.address_line_2 = '';
  acf.fields.address_map.Address.prototype.city = '';
  acf.fields.address_map.Address.prototype.state = '';
  acf.fields.address_map.Address.prototype.zip = '';
  acf.fields.address_map.Address.prototype.country = '';
  acf.fields.address_map.Address.prototype.lat = 0;
  acf.fields.address_map.Address.prototype.lng = 0;
  acf.fields.address_map.Address.prototype.url = '';
  acf.fields.address_map.Address.prototype.formatted_address = '';

  /**
   * Parse out a place into the address
   * @param {google.maps.places.PlaceResult} place
   */
  acf.fields.address_map.Address.prototype.parse = function(place) {
    if(typeof place != 'object' || typeof place.address_components != 'object') return;

    var data = {
      number: '',
      street: '',
      unit: '',
      city: '',
      state: '',
      zip: '',
      country: ''
    };

    for(var k in place.address_components) {
      if(place.address_components.hasOwnProperty(k) &&
          typeof(acf.fields.address_map.Address.input_map[place.address_components[k].types[0]]) !== 'undefined') {
        var map = acf.fields.address_map.Address.input_map[place.address_components[k].types[0]];
        data[map.to] = place.address_components[k][map.use];
      }
    }

    this.address_line_1 = [data.number, data.street].join(' ');
    this.address_line_2 = data.unit || '';
    this.city = data.city || '';
    this.state = data.state || '';
    this.zip = data.zip || '';
    this.country = data.country || '';
    this.lat = place.geometry.location.lat();
    this.lng = place.geometry.location.lng();
    this.url = 'http://maps.google.com/?ll=' + this.lat + ',' + this.lng;
    if(place.name && place.name !== this.address_line_1)  this.name               = place.name;
    if(place.formatted_phone_number)                      this.phone              = place.formatted_phone_number;
    if(place.website)                                     this.website            = place.website;
    if(place.formatted_address)                           this.formatted_address  = place.formatted_address;
  };

	/*
	 *  acf/setup_fields
	 *
	 *  run init function on all elements for this field
	 *
	 *  @type	event
	 *  @date	20/07/13
	 *
	 *  @param	{object}	e		event object
	 *  @param	{object}	el		DOM object which may contain new ACF elements
	 *  @return	N/A
	 */
	$(document).on('acf/setup_fields', function(e, el) {
		// vars
		$fields = $(el).find('.acf-address-map');
		// validate
		if (!$fields.exists()) {
			return;
		}
    var load_google_maps_api_v3 = function(){
      google.load('maps', '3', {
        other_params: 'sensor=false&libraries=places',
        callback: function() {
          $fields.each(function() {
            acf.fields.address_map.set({
              $el: $(this)
            }).init();
          });
        }
      });
    };
		// load google maps api
		if (typeof google == 'undefined') $.getScript('https://www.google.com/jsapi', load_google_maps_api_v3);
		else load_google_maps_api_v3();
	});
	
	/*
	 *  Events
	 *
	 *  jQuery events for this field
	 *
	 *  @type	function
	 *  @date	1/03/2011
	 *
	 *  @param	N/A
	 *  @return	N/A
	 */
	$(document).on('click', '.acf-address-map .acf-sprite-remove', function(e) {
		e.preventDefault();
		acf.fields.address_map.set({
			$el: $(this).closest('.acf-address-map')
		}).clear();
		$(this).blur();
	});
	$(document).on('click', '.acf-address-map .acf-sprite-locate', function(e) {
		e.preventDefault();
		acf.fields.address_map.set({
			$el: $(this).closest('.acf-address-map')
		}).locate();
		$(this).blur();
	});
	$(document).on('click', '.acf-address-map .title h4', function(e) {
		e.preventDefault();
		acf.fields.address_map.set({
			$el: $(this).closest('.acf-address-map')
		}).edit();
	});
	$(document).on('keypress', '.acf-address-map .search', function(e) {
		// prevent form from submitting
		if (e.which == 13 || e.keyCode == 13) {
      e.stopPropagation();
			return false;
		}
	});
	$(document).on('blur', '.acf-address-map .search', function(e) {
		// vars
		var $el = $(this).closest('.acf-address-map');
		// has a value?
		if ($el.find('.input-lat').val()) {
			$el.addClass('active');
		}
	});
	$(document).on('acf/fields/tab/show acf/conditional_logic/show', function(e, $field) {
		// validate
		if (!acf.fields.address_map.ready) {
			return;
		}
		// validate
		if ($field.attr('data-field_type') == 'address_map') {
			acf.fields.address_map.set({
				$el: $field.find('.acf-address-map')
			}).refresh();
		}
	});

})(jQuery, acf);