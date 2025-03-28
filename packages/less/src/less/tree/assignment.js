import Node from './node';

const Assignment = function(key, val) {
    this.key = key;
    this.value = val;
};

Assignment.prototype = new Node();

Assignment.prototype.accept = function(visitor) {
    this.value = visitor.visit(this.value);
};

Assignment.prototype.eval = function(context) {
    if (this.value.eval) {
        return new Assignment(this.key, this.value.eval(context));
    }
    return this;
};

Assignment.prototype.genCSS = function(context, output) {
    output.add(`${this.key}=`);
    if (this.value.genCSS) {
        this.value.genCSS(context, output);
    } else {
        output.add(this.value);
    }
};

Assignment.prototype.type = 'Assignment';
export default Assignment;
