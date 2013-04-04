'use strict';

module.exports = {
  t: function(value) {
    var components = value.split(',');
    if (components.length > 2) {
      return false;
    }
    var start = components[0]? components[0] : '';
    var end = components[1]? components[1] : '';
    if ((start === '' && end === '') ||
        (start && !end && value.indexOf(',') !== -1)) {
      return false;
    }
    /**
     * Regexp extracting NTP
     * 'hours:minutes:seconds.milliseconds'
     * or ''
     * or 'ntp:hours:minutes:seconds.milliseconds'
     */
    var npt = /^((npt\:)?((\d+\:(\d\d)\:(\d\d))|((\d\d)\:(\d\d))|(\d+))(\.\d*)?)?$/;
    if ((npt.test(start)) &&
        (npt.test(end))) {
      /**
       * Removes NTP prefixes
       */
      start = start.replace(/^npt\:/, '');
      /**
       * replace a sole trailing dot, which is legal:
       * npt-sec = 1*DIGIT [ "." *DIGIT ]
       */
      start = start.replace(/\.$/, '');
      end = end.replace(/\.$/, '');
      var convertNPTToSeconds = function(time) {
        if (time === '') {
          return false;
        }
        /** possible cases:
         * 12:34:56.789
         *    34:56.789
         *       56.789
         *       56
         */
        var hours;
        var minutes;
        var seconds;
        time = time.split(':');
        var length = time.length;
        if (length === 3) {
          hours = parseInt(time[0], 10);
          minutes = parseInt(time[1], 10);
          seconds = parseFloat(time[2]);
        } else if (length === 2) {
          hours = 0;
          minutes = parseInt(time[0], 10);
          seconds = parseFloat(time[1]);
        } else if (length === 1) {
          hours = 0;
          minutes = 0;
          seconds = parseFloat(time[0]);
        } else {
          return false;
        }
        if (hours > 23) {
          return false;
        }
        if (minutes > 59) {
          return false;
        }
        if (seconds >= 60) {
          return false;
        }
        return hours * 3600 + minutes * 60 + seconds;
      };
      var startNormalized = convertNPTToSeconds(start);
      var endNormalized = convertNPTToSeconds(end);
      /**
       * Compares start and/or end
       * then return final value
       */
      if (start && end) {
        if (startNormalized < endNormalized) {
          return {
            name: 'npt',
            value: {
              start: startNormalized,
              end: endNormalized
            }
          };
        } else {
          return false;
        }
      } else {
        if ((convertNPTToSeconds(start) !== false) ||
            (convertNPTToSeconds(end) !== false)) {
          return {
            name: 'npt',
            value: {
              start: startNormalized === false ? '' : startNormalized,
              end: endNormalized === false ? '' : endNormalized,
            }
          };
        } else {
          return false;
        }
      }
    }
    /**
     * Regexp for SMTPE
     * hours:minutes:seconds:frames.further-subdivison-of-frames
     * or ''
     * of 'smtpe*:hours:minutes:seconds:frames.further-subdivison-of-frames'
     */
    var smpte = /^(\d+\:\d\d\:\d\d(\:\d\d(\.\d\d)?)?)?$/;
    /**
     * Removes STMPE prefixes
     */
    var found = start.match(/^(smpte(-25|-30|-30-drop)?).*/, '$1');
    var prefix = 'smtpe';
    if (found) {
      prefix = found[0];
    }
    start = start.replace(/^smpte(-25|-30|-30-drop)?\:/, '');
    if ((smpte.test(start)) && (smpte.test(end))) {
      /**
       * Conversion function
       *
       * Approximate frames as milliseconds,
       * and further-subdivison-of-frames as microseconds.
       * to be able to compare both start and end
      */
      var convertSMTPEToSeconds = function(time) {
        if (time === '') {
          return false;
        }
        /**
         * possible cases:
         * 12:34:56
         * 12:34:56:78
         * 12:34:56:78.90
         */
        var hours;
        var minutes;
        var seconds;
        var frames;
        var subframes;
        time = time.split(':');
        var length = time.length;
        if (length === 3) {
          hours = parseInt(time[0], 10);
          minutes = parseInt(time[1], 10);
          seconds = parseInt(time[2], 10);
          frames = 0;
          subframes = 0;
        } else if (length === 4) {
          hours = parseInt(time[0], 10);
          minutes = parseInt(time[1], 10);
          seconds = parseInt(time[2], 10);
          if (time[3].indexOf('.') === -1) {
            frames = parseInt(time[3], 10);
            subframes = 0;
          } else {
            var frameSubFrame = time[3].split('.');
            frames = parseInt(frameSubFrame[0], 10);
            subframes = parseInt(frameSubFrame[1], 10);
          }
        } else {
          return false;
        }
        if (hours > 23) {
          return false;
        }
        if (minutes > 59) {
          return false;
        }
        if (seconds > 59) {
          return false;
        }
        return hours * 3600 + minutes * 60 + seconds +
            frames * 0.001 + subframes * 0.000001;
      };
      /**
       * Compares start and/or end
       * then return final value
       */
      if (start && end) {
        if (convertSMTPEToSeconds(start) < convertSMTPEToSeconds(end)) {
          return {
            name: prefix,
            value: {
              start: start,
              end: end
            }
          };
        } else {
          return false;
        }
      } else {
        if ((convertSMTPEToSeconds(start) !== false) ||
            (convertSMTPEToSeconds(end) !== false)) {
          return {
            name: prefix,
            value: {
              start: start,
              end: end
            }
          };
        } else {
          return false;
        }
      }
    }
    /**
     * Regexp for iso8601 date-times
     */
    var wallClock = /^((\d{4})(-(\d{2})(-(\d{2})(T(\d{2})\:(\d{2})(\:(\d{2})(\.(\d+))?)?(Z|(([-\+])(\d{2})\:(\d{2})))?)?)?)?)?$/;
    /**
     * Removes prefix
     */
    start = start.replace('clock:', '');
    if ((wallClock.test(start)) && (wallClock.test(end))) {
      if (start && end) {
        /**
         * Compares start and/or end
         * then return final value
         * if both start and end are given,
         * then the start must be before the end
         */
        if (Date.parse(start) <= Date.parse(end)) {
          return {
            name: 'clock',
            value: {
              start: start,
              end: end
            }
          };
        } else {
          return false;
        }
      } else {
        return {
          name: 'clock',
          value: {
            start: start,
            end: end
          }
        };
      }
    }

    return false;
  },
  /**
   * id dimensions must be split with ":"
   * ensuring "name:value" extraction
   */
  id: function(value) {
    var components = value.split(':');
    if (components.length !== 2) {
      return false;
    }
    return {
      value: components[1],
      name: components[0]
    };
  }
};
