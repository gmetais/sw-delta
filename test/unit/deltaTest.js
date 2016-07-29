var expect          = require('chai').expect;
var fs              = require('fs');
var path            = require('path');

var deltaCalculator = require('../../node_modules/sw-delta-nodejs/lib/deltaCalculator');
var deltaApplier    = require('../../lib/deltaApplier');

describe('DeltaCalculator and DeltaApplier', function() {
  
    describe('the "getDelta" function', function() {

        it('works with a simple test', function() {
            var delta = deltaCalculator.getDelta('Hello the world! Welcome!', 'Hello world and other planets! Welcome!');
            expect(delta).to.be.a('string');
        });
        
    });

    describe('the "getDelta" and "applyDelta" functions', function() {
        it('create a delta for the same files than apply it', function() {
            var oldString = 'Hello world!';
            var newString = 'Hello world!';

            var delta = deltaCalculator.getDelta(oldString, newString);
            expect(delta).to.equal('');
            var newNewString = deltaApplier.applyDelta(oldString, delta);

            expect(newString).to.equal(newNewString);
        });

        it('create a delta for a removal then apply it', function() {
            var oldString = 'Hello the world!';
            var newString = 'Hello world!';

            var delta = deltaCalculator.getDelta(oldString, newString);
            var newNewString = deltaApplier.applyDelta(oldString, delta);

            expect(newString).to.equal(newNewString);
        });

        it('create a delta for an addition then apply it', function() {
            var oldString = 'Hello world!';
            var newString = 'Hello the world!';

            var delta = deltaCalculator.getDelta(oldString, newString);
            var newNewString = deltaApplier.applyDelta(oldString, delta);

            expect(newString).to.equal(newNewString);
        });

        it('create a delta for additions and removals then apply it', function() {
            var oldString = 'Hello the world! Welcome!';
            var newString = 'Hello world and other planets! Welcome!';

            var delta = deltaCalculator.getDelta(oldString, newString);
            var newNewString = deltaApplier.applyDelta(oldString, delta);

            expect(newString).to.equal(newNewString);
        });

        it('create a delta for a huge non-minified file then apply it', function() {
            var angular_1_4_4 = fs.readFileSync(path.join(__dirname, '../fixtures/angular.1.4.4.js'), 'utf-8');
            var angular_1_4_5 = fs.readFileSync(path.join(__dirname, '../fixtures/angular.1.4.5.js'), 'utf-8');

            var delta = deltaCalculator.getDelta(angular_1_4_4, angular_1_4_5);
            var newString = deltaApplier.applyDelta(angular_1_4_4, delta);

            expect(angular_1_4_5.substr(2000, 1000)).to.equal(newString.substr(2000, 1000));
        });

        it('create a delta for a huge minified file then apply it', function() {
            var angular_1_4_4 = fs.readFileSync(path.join(__dirname, '../fixtures/angular.1.4.4-min.js'), 'utf-8');
            var angular_1_4_5 = fs.readFileSync(path.join(__dirname, '../fixtures/angular.1.4.5-min.js'), 'utf-8');

            var delta = deltaCalculator.getDelta(angular_1_4_4, angular_1_4_5);
            var newString = deltaApplier.applyDelta(angular_1_4_4, delta);

            expect(angular_1_4_5).to.equal(newString);
        });
    });

});