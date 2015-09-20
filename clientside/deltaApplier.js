var DeltaApplier = function() {
    'use strict';

    this.applyDelta = function(oldString, delta) {
        var diffTable = JSON.parse(delta);
        var newString = '';
        var oldStringCursor = 0;
        var deletedChars = 0;

        for (var charIndex in diffTable) {
            
            var numberOfMissingChars = charIndex - deletedChars - newString.length;
            if (numberOfMissingChars > 0) {
                newString += oldString.substr(oldStringCursor, numberOfMissingChars);
                oldStringCursor += numberOfMissingChars;
            }

            var adding = diffTable[charIndex][0] === '+';
            if (adding) {
                var charsToAdd = diffTable[charIndex].substring(1);
                newString += charsToAdd;
            } else {
                // Removing
                var numberOfCharsToRemove = parseInt(diffTable[charIndex].substring(1), 10);
                oldStringCursor += numberOfCharsToRemove;
                deletedChars += numberOfCharsToRemove;
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