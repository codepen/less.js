import Node from './node';

const Attribute = function(key, op, value) {
    this.key = key;
    this.op = op;
    this.value = value;
};

Attribute.prototype = new Node();

Attribute.prototype.eval = function(context) {
    return new Attribute(this.key.eval ? this.key.eval(context) : this.key,
        this.op, (this.value && this.value.eval) ? this.value.eval(context) : this.value);
};

Attribute.prototype.genCSS = function(context, output) {
    output.add(this.toCSS(context));
};

Attribute.prototype.toCSS = function(context) {
    let value = this.key.toCSS ? this.key.toCSS(context) : this.key;

    if (this.op) {
        value += this.op;
        value += (this.value.toCSS ? this.value.toCSS(context) : this.value);
    }

    return `[${value}]`;
};

Attribute.prototype.type = 'Attribute';
export default Attribute;
