import Node from './node';
import unitConversions from '../data/unit-conversions';
import * as utils from '../utils';

const Unit = function(numerator, denominator, backupUnit) {
    this.numerator = numerator ? utils.copyArray(numerator).sort() : [];
    this.denominator = denominator ? utils.copyArray(denominator).sort() : [];
    if (backupUnit) {
        this.backupUnit = backupUnit;
    } else if (numerator && numerator.length) {
        this.backupUnit = numerator[0];
    }
};

Unit.prototype = new Node();

Unit.prototype.clone = function() {
    return new Unit(utils.copyArray(this.numerator), utils.copyArray(this.denominator), this.backupUnit);
};

Unit.prototype.genCSS = function(context, output) {
    // Dimension checks the unit is singular and throws an error if in strict math mode.
    const strictUnits = context && context.strictUnits;
    if (this.numerator.length === 1) {
        output.add(this.numerator[0]); // the ideal situation
    } else if (!strictUnits && this.backupUnit) {
        output.add(this.backupUnit);
    } else if (!strictUnits && this.denominator.length) {
        output.add(this.denominator[0]);
    }
};

Unit.prototype.toString = function() {
    let i;
    let returnStr = this.numerator.join('*');
    for (i = 0; i < this.denominator.length; i++) {
        returnStr += `/${this.denominator[i]}`;
    }
    return returnStr;
};

Unit.prototype.compare = function(other) {
    return this.is(other.toString()) ? 0 : undefined;
};

Unit.prototype.is = function(unitString) {
    return this.toString().toUpperCase() === unitString.toUpperCase();
};

Unit.prototype.isLength = function() {
    return RegExp('^(px|em|ex|ch|rem|in|cm|mm|pc|pt|ex|vw|vh|vmin|vmax)$', 'gi').test(this.toCSS());
};

Unit.prototype.isEmpty = function() {
    return this.numerator.length === 0 && this.denominator.length === 0;
};

Unit.prototype.isSingular = function() {
    return this.numerator.length <= 1 && this.denominator.length === 0;
};

Unit.prototype.map = function(callback) {
    let i;

    for (i = 0; i < this.numerator.length; i++) {
        this.numerator[i] = callback(this.numerator[i], false);
    }

    for (i = 0; i < this.denominator.length; i++) {
        this.denominator[i] = callback(this.denominator[i], true);
    }
};

Unit.prototype.usedUnits = function() {
    let group;
    const result = {};
    let mapUnit;
    let groupName;

    mapUnit = atomicUnit => {
        /* jshint loopfunc:true */
        if (group.hasOwnProperty(atomicUnit) && !result[groupName]) {
            result[groupName] = atomicUnit;
        }

        return atomicUnit;
    };

    for (groupName in unitConversions) {
        if (unitConversions.hasOwnProperty(groupName)) {
            group = unitConversions[groupName];

            this.map(mapUnit);
        }
    }

    return result;
};

Unit.prototype.cancel = function() {
    const counter = {};
    let atomicUnit;
    let i;

    for (i = 0; i < this.numerator.length; i++) {
        atomicUnit = this.numerator[i];
        counter[atomicUnit] = (counter[atomicUnit] || 0) + 1;
    }

    for (i = 0; i < this.denominator.length; i++) {
        atomicUnit = this.denominator[i];
        counter[atomicUnit] = (counter[atomicUnit] || 0) - 1;
    }

    this.numerator = [];
    this.denominator = [];

    for (atomicUnit in counter) {
        if (counter.hasOwnProperty(atomicUnit)) {
            const count = counter[atomicUnit];

            if (count > 0) {
                for (i = 0; i < count; i++) {
                    this.numerator.push(atomicUnit);
                }
            } else if (count < 0) {
                for (i = 0; i < -count; i++) {
                    this.denominator.push(atomicUnit);
                }
            }
        }
    }

    this.numerator.sort();
    this.denominator.sort();
};

Unit.prototype.type = 'Unit';
export default Unit;
