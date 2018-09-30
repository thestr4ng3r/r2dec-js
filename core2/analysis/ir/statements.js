/* 
 * Copyright (C) 2018 elicn
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

module.exports = (function() {
    /**
     * Statement abstract base class.
     * @param {!Long} addr Address of original assembly instruction
     * @param {Array} exprs List of expressions enclosed by this statement; usually just one
     * @constructor
     */
    var _statement = function(addr, exprs) {
        /** @type {!number} */
        this.addr = addr;

        /** @type {Array>} */
        this.expressions = exprs || [];

        // set parent to each expression
        this.expressions.forEach(function(e, i) {
            e.parent = [this, i];
        }, this);

        /** @type {Array} */
        this.statements = [];

        /**
         * Generate a deep copy of this.
         * @returns {!_statement}
         */
        this.clone = function() {
            return Object.create(this, {
                'expressions': {
                    value: this.expressions.map(function(e) { return e.clone(); })
                }
            });
        };

        /**
         * Generate a string representation of this
         * @returns {!string}
         */
        this.toString = function(opt) {
            var exprs = this.expressions.map(function(e) {
                return e.toString(opt);
            }).join('\n');

            return ['0x' + this.addr.toString(16), ':', exprs].join(' ');
        };
    };

    var _container = function(block, stmts) {
        this.block = block;
        this.statements = stmts || [];

        this.statements.forEach(function(stmt) {
            stmt.container = this;
        }, this);

        this.push = function(stmt) {
            stmt.container = this;

            this.statements.push(stmt);
        };

        /**
         * Generate a deep copy of this.
         * @returns {!_container}
         */
        this.clone = function() {
            return Object.create(this, {
                'statements': {
                    value: this.statements.map(function(s) { return s.clone(); })
                }
            });
        };

    };

    var _if = function(addr, cond_expr, then_cntr, else_cntr) {
        _statement.call(this, addr, [cond_expr]);

        this.cond_expr = cond_expr;
        this.then_cntr = then_cntr;
        this.else_cntr = else_cntr;

        this.statements = Array.prototype.concat(
                this.then_cntr.statements,
                this.else_cntr
                    ? this.else_cntr.statements
                    : []);

        this.containers = Array.prototype.concat(
            [this.then_cntr],
            this.else_cntr
                ? [this.else_cntr]
                : []);

        this.toString = function(opt) {
            var cond = ['if', '(' + this.cond_expr.toString(opt) + ')'].join(' ');
            var then_blk = ['{', this.then_cntr.toString(opt), '}'].join('\n');
            var else_blk = this.else_cntr
                ? ['else', '{', this.else_cntr.toString(opt), '}'].join('\n')
                : '';
            return [cond, then_blk, else_blk].join('\n');
        };
    };

    _if.prototype = Object.create(_statement.prototype);

    var _while = function(addr, expr, loop_container) {
        _statement.call(this, addr, [expr]);

        this.cond_expr = expr;
        this.loop_body = loop_container;

        this.statements = loop_container.statements;
        this.containers = [loop_container];

        this.toString = function(opt) {
            // TODO: implement this
        };
    };

    _while.prototype = Object.create(_statement.prototype);

    var _do_while = function(addr, expr, loop_container) {
        _statement.call(this, addr, [expr]);

        this.cond_expr = expr;
        this.loop_body = loop_container;

        this.statements = loop_container.statements;
        this.containers = [loop_container];

        this.toString = function(opt) {
            // TODO: implement this
        };
    };

    _do_while.prototype = Object.create(_statement.prototype);

    var _break = function(addr) {
        _statement.call(this, addr, []);

        this.toString = function() {
            return 'break';
        };
    };

    _break.prototype = Object.create(_statement.prototype);

    var _continue = function(addr) {
        _statement.call(this, addr, []);

        this.toString = function() {
            return 'continue';
        };
    };

    _continue.prototype = Object.create(_statement.prototype);

    var _ret = function(addr, expr) {
        _statement.call(this, addr, [expr]);

        this.toString = function(opt) {
            return ['return', this.expressions[0].toString(opt)].join(' ').trim();
        };
    };

    _ret.prototype = Object.create(_statement.prototype);

    var _goto = function(addr, dst) {
        _statement.call(this, addr, [dst]);

        this.dest = dst;

        this.toString = function(opt) {
            return [
                'goto',
                this.expressions[0].toString(16)
            ].join(' ');
        };
    };

    _goto.prototype = Object.create(_statement.prototype);

    var _branch = function(addr, cond, taken, not_taken) {
        _statement.call(this, addr, [cond, taken, not_taken]);

        this.taken = taken;
        this.not_taken = not_taken;

        this.toString = function(opt) {
            return [
                'if',
                this.expressions[0].toString(opt),
                'goto',
                this.expressions[1].toString(opt)
            ].join(' ');
        };
    };

    _branch.prototype = Object.create(_statement.prototype);

    return {
        make_statement: function(addr, exp) {
            return exp instanceof _statement ? exp : new _statement(addr, [exp]);
        },

        container:  _container,
        ret:        _ret,
        goto:       _goto,
        branch:     _branch,
        if:         _if,
        while:      _while,
        do_while:   _do_while,
        break:      _break,
        continue:   _continue,
    };
})();