var DeltaApplier = function() {
    'use strict';

    this.applyDelta = function(oldString, delta) {

        // Extract the separator, which is the first char in the delta
        var separator = delta.substr(0, 1);
        var diffArray = delta.split(separator);
        diffArray.shift();

        var newString = '';
        var oldStringCursor = 0;
        var charIndex = 0;
        var deletedChars = 0;
        var regex = /(\d+)([+-])([\s\S]+)/m;
        var adding, chunks, numberOfCharsToRemove;

        for (var i = 0, max = diffArray.length; i < max; i++) {

            chunks = regex.exec(diffArray[i]);
            charIndex += parseInt(chunks[1], 10);
            
            var numberOfMissingChars = charIndex - deletedChars - newString.length;
            if (numberOfMissingChars > 0) {
                newString += oldString.substr(oldStringCursor, numberOfMissingChars);
                oldStringCursor += numberOfMissingChars;
            }

            adding = (chunks[2] === '+');

            if (adding) {
                newString += chunks[3];
                charIndex += chunks[3].length;
            } else {
                // Removing
                numberOfCharsToRemove = parseInt(chunks[3], 10);
                deletedChars += numberOfCharsToRemove;
                oldStringCursor += numberOfCharsToRemove;
                charIndex += numberOfCharsToRemove;
            }
        }

        // At the end, copy the remaining chars from the oldString
        if (oldStringCursor < oldString.length) {
            newString += oldString.substring(oldStringCursor);
        }

        return newString;
    };
};

module.exports = new DeltaApplier();