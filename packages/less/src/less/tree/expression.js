import Node from './node';
import Paren from './paren';
import Comment from './comment';
import Dimension from './dimension';
import * as Constants from '../constants';
const MATH = Constants.Math;

const Expression = function(value, noSpacing) {
    this.value = value;
    this.noSpacing = noSpacing;
    if (!value) {
        throw new Error('Expression requires an array parameter');
    }
};

Expression.prototype = new Node();

Expression.prototype.accept = function(visitor) {
    this.value = visitor.visitArray(this.value);
};

Expression.prototype.eval = function(context) {
    let returnValue;
    const mathOn = context.isMathOn();

    const inParenthesis = this.parens && 
        (context.math !== MATH.STRICT_LEGACY || !this.parensInOp);

    let doubleParen = false;
    if (inParenthesis) {
        context.inParenthesis();
    }
    if (this.value.length > 1) {
        returnValue = new Expression(this.value.map(e => {
            if (!e.eval) {
                return e;
            }
            return e.eval(context);
        }), this.noSpacing);
    } else if (this.value.length === 1) {
        if (this.value[0].parens && !this.value[0].parensInOp && !context.inCalc) {
            doubleParen = true;
        }
        returnValue = this.value[0].eval(context);
    } else {
        returnValue = this;
    }
    if (inParenthesis) {
        context.outOfParenthesis();
    }
    if (this.parens && this.parensInOp && !mathOn && !doubleParen 
        && (!(returnValue instanceof Dimension))) {
        returnValue = new Paren(returnValue);
    }
    return returnValue;
};

Expression.prototype.genCSS = function(context, output) {
    for (let i = 0; i < this.value.length; i++) {
        this.value[i].genCSS(context, output);
        if (!this.noSpacing && i + 1 < this.value.length) {
            output.add(' ');
        }
    }
};

Expression.prototype.throwAwayComments = function() {
    this.value = this.value.filter(v => !(v instanceof Comment));
};

Expression.prototype.type = 'Expression';
export default Expression;
