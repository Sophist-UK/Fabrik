/**
 * Fabrik back-end ajax request queue
 *
 * @copyright: Copyright (C) 2005-2018  Media A-Team, Inc. - All rights reserved.
 * @license:   GNU/GPL http://www.gnu.org/copyleft/gpl.html
 */

/* This object was first used to serialise ajax requests so that they are not all fired at the same time
   pending inclusion of https://github.com/joomla/joomla-platform/pull/1209/ in Joomla.
   This PR was first included in J3.4.0 in 2015, and since J3.3 has been out of support for some time,
   this original code is no longer required.

   This module has therefore been repurposed as an ajax request / response caching mechanism for use in complex
   backend forms esp. visualisation which can have tens of fabriktables / listfields fields which are element lists
   which run ajax to get the element list when the list name field is changed by the user.

   In many cases these run identical ajax request several times, so this module also consolidates these into a single ajax request
   and relays the callbacks to each of the original requests.

   It is anticipated that this will result in significant performance improvements for fabriktables / listfields fields,
   where the elements dropdown for a list may be requested several times.

   Note 1: Because data is cached until user refreshes entire page by e.g. clicking Save, this will not take into account changes
   to server data made by another user or in another window. This is not anticipated to be a problem for its intended usage only in
   Fabrik back-end, however its primary use is to avoid repeated ajax calls when the user changes e.g. a list selection dropdown,
   however if this turns out to be an issue, clearing cache results (say 60 seconds) after last event has been handled would resolve this.

   Note 2: Ajax calls are currently all Mootools, however this module has been structured to distinguish between Mootools and other ajax calls
   and so can be easily extended to provide similar functionality for jQuery or native or other lightweight ajax functionality.

   Note 3: At present requests identical except for different Mootools Request timeout option values are considered different requests -
   therefore onTimeout will run consistently based on the time since original request was sent.

   Note 4: Since all callbacks are run in order to relay them to calling fields, this module includes functionality to allow for default error handlers.
   so for example, error messages can be logged or an ajax request which failed due to a temporary network glitch could be retried.
   In the initial release of this rewritten module, no such error handlers are included.

   Sophist March 2018
*/

define(['jquery'], function (jQuery) {
	var RequestQueue = new Class({

		cache: {}, // store request events and event result data for ajax requests

		initialize: function () {
		},

		add: function (request) {
			// Fabrik currently only uses Mootools xhr but this is designed to be extended to support e.g. jQuery or native ajax calls.
			if (Request && request instanceof Request) {
				this.addMootoolsRequest(request);
			} else if (Fabrik.debug) {
				fconsole('fabrik requestqueue: Unknown ajax request type', request);
			}
		},

		/* Algorithm is as follows:
		   1. Calculate hash on request options with all (callback) functions removed.
		   2. If hash does not exist in cache, add to cache and send ajax request
		   3. If hash already exists in cache, execute all callback(s) that have already been executed using previous response.
		   Note: Opportunity to provide debugging messages for error situations not handled by callbacks.
		*/

		// Callbacks taken from https://mootools.net/core/docs/1.6.0/Request/Request
		mootoolsCallbacks: [
			'request',
			'loadstart',
			'progress',
			'complete',
			'cancel',
			'success',
			'failure',
			'exception',
			'timeout',
		],

		addMootoolsRequest: function (request) {
			// Fabrik should not create synchronous requests, but if one is received, we need to run it immediately.
			if (request.options.async === false) {
				request.send();
				return;
			}

			var hash = JSON.stringify(request.options);
			if (hash in this.cache) {
				// Add this request to the cache entry and callback any callbacks already executed.
				var cacheEntry = this.cache[hash];
				if (Fabrik.debug) {
					fconsole('fabrik requestqueue: Adding ajax request: Repeat', cacheEntry.events.length, request);
				}
				cacheEntry.events.push(request.$events);
				var i = 0;
				this.mootoolsCallbacks.forEach(function(callbackName) {
					if (callbackName in cacheEntry && callbackName in request.$events) {
						var xhr = cacheEntry[callbackName][0];
						var args = cacheEntry[callbackName][1];
						if (Fabrik.debug) {
							fconsole('fabrik requestqueue: Ajax', 'on' + callbackName, 'callback: Repeat', i);
						}
						var events = request.$events[callbackName];
						events.forEach(function(callback) {
							callback.apply(xhr, args);
						});
					}
					i++;
				});
			} else {
				if (Fabrik.debug) {
					fconsole('fabrik requestqueue: Adding ajax request: Repeat 0', request);
				}

				var cacheEntry = {
					'events': [request.$events],
				};
				this.cache[hash] = cacheEntry;

				var options = JSON.parse(hash);
				this.mootoolsCallbacks.forEach(function(callbackName) {
					options['on' + callbackName.charAt(0).toUpperCase() + callbackName.slice(1)] = this.createMootoolsCallback(callbackName);
				}.bind(this));

				var metaRequest = new Request(options);
				metaRequest.requestqueue = this;
				metaRequest.cacheEntry = this.cache[hash];
				metaRequest.send();
			}
		},

		createMootoolsCallback: function (callbackName) {
			return function() {
				/* when called "this" is the metaRequest object so
				   this.requestqueue is the requestqueue object and
				   this.cacheEntry is the cache entry for all request options exactly like this that contain the real callbacks. */
				var args = Array.prototype.slice.call(arguments);
				this.cacheEntry[callbackName] = [this, args];
				var defaultCalled = false;
				var i = 0;
				this.cacheEntry.events.forEach(function(requestEvents) {
					if (callbackName in requestEvents) {
						if (Fabrik.debug) {
							fconsole('fabrik requestqueue: Ajax', 'on' + callbackName, 'callback: Repeat', i);
						}
						var events = requestEvents[callbackName];
						events.forEach(function(callback) {
							callback.apply(this, args);
						});
					} else if (!defaultCalled && this.requestqueue.hasOwnProperty('mootoolsDefault_' + callbackName)) {
						// Call a default error handler if it exists
						defaultCalled = true;
						('mootoolsDefault_' + callbackName).apply(this, args);
					}
					i++;
				}.bind(this));
			};
		},

		empty: function () {
			// Cancel all currently running xhr and empty the cache
		}
	});

	return RequestQueue;
});
