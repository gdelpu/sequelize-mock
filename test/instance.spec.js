'use strict';

var should = require('should');
var bluebird = require('bluebird');
var proxyquire = require('proxyquire').noCallThru();

var ErrorMock = {
	ValidationErrorItem : function (msg, type, path, value) {
		this.message = msg;
		this.type    = type;
		this.path    = path;
		this.value   = value;
	},
	ValidationError : function (msg, errors) {
		this.message = msg || 'Validation Error';
		this.errors = errors || [];
	},
};

var Instance = proxyquire('../src/instance', {
	'./errors' : ErrorMock,
});

describe('Instance', function () {
	
	describe('__constructor', function () {
		it('should always assign an id, createdAt, and updatedAt value', function () {
			var inst = new Instance();
			
			inst._values.should.have.property('id');
			inst._values.should.have.property('createdAt');
			inst._values.should.have.property('updatedAt');
		});
		it('should not override passed in id, createdAt, and updatedAt values', function () {
			var inst = new Instance({}, {
				id: 5555,
				createdAt: 'Yesterday',
				updatedAt: 'Yesterday',
			});
			
			inst._values.should.have.property('id').which.is.exactly(5555);
			inst._values.should.have.property('createdAt').which.is.exactly('Yesterday');
			inst._values.should.have.property('updatedAt').which.is.exactly('Yesterday');
		});
		
		it('should assign any default values', function () {
			var inst = new Instance({
				'foo': 'bar',
			});
			
			inst._values.should.have.property('foo').which.is.exactly('bar');
			inst._values.should.not.have.property('baz');
		});
		
		it('should override default values with passed in values', function () {
			var inst = new Instance({
				'foo': 'bar',
				'baz': 'bin',
			}, {
				'foo': 'test',
			});
			
			inst._values.should.have.property('foo').which.is.exactly('test');
			inst._values.should.have.property('baz').which.is.exactly('bin');
		});
	});
	
	describe('#set', function () {
		it('should set the value of a property on the object', function () {
			var inst = new Instance();
			
			inst._values.should.not.have.property('foo');
			inst.set('foo', 'bar');
			
			inst._values.should.have.property('foo').which.is.exactly('bar');
		});
	});
	
	describe('#get', function () {
		it('should get the value of a property on the object', function () {
			var inst = new Instance();
			inst._values.foo = 'bar';
			
			inst.get('foo').should.be.exactly('bar');
		});
	});
	
	describe('#validate', function () {
		it('should return no validation errors if no errors are set on the instances', function (done) {
			var inst = new Instance();
			
			inst.validate().then(function (err) {
				should.not.exist(err);
				done();
			}).catch(done);
		});
		
		it('should return validation errors if added to the instance', function (done) {
			var inst = new Instance({}, { 'test': 'val' });
			inst.$addValidationError('test', 'Test Error Message', 'mock test type');
			
			inst.validate().then(function (err) {
				should.exist(err);
				err.errors.length.should.equal(1);
				err.errors[0].message.should.equal('Test Error Message');
				err.errors[0].type.should.equal('mock test type');
				err.errors[0].path.should.equal('test');
				err.errors[0].value.should.equal('val');
				done();
			}).catch(done);
		});
	});
	
	describe('#save', function () {
		it('should return a promise object', function (done) {
			var inst = new Instance();
			
			inst.save().then(function (passedIn) {
				passedIn.should.be.exactly(inst);
				done();
			}).catch(done);
		});
		
		it('should not save if there are validation errors', function (done) {
			var inst = new Instance();
			inst.$addValidationError('test', 'Test Error Message', 'mock test type');
			
			inst.save().then(function (passedIn) {
				done(new Error('Saved when there were validation errors instead of throwing'));
			}, function (err) {
				err.errors.length.should.equal(1);
				err.errors[0].message.should.equal('Test Error Message');
				err.errors[0].type.should.equal('mock test type');
				err.errors[0].path.should.equal('test');
				done();
			}).catch(done);
		});
	});
	
	describe('#destroy', function () {
		it('should return a promise object', function () {
			var inst = new Instance();
			inst.destroy().should.be.instanceOf(bluebird);
		});
	});
	
	describe('#reload', function () {
		it('should return a promise object', function (done) {
			var inst = new Instance();
			
			inst.reload().then(function (passedIn) {
				passedIn.should.be.exactly(inst);
				done();
			}).catch(done);
		});
	});
	
	describe('#update', function () {
		it('should update values passed in', function () {
			var inst = new Instance();
			
			inst._values.should.not.have.property('foo');
			inst.update({
				'foo': 'bar'
			});
			
			inst._values.should.have.property('foo').which.is.exactly('bar');
		});
		
		it('should return a promise object', function (done) {
			var inst = new Instance();
			
			inst.update().then(function (passedIn) {
				passedIn.should.be.exactly(inst);
				done();
			}).catch(done);
		});
	});
	
	describe('#toJSON', function () {
		it('should have the function aliased to toJson', function () {
			var inst = new Instance();
			inst.should.have.property('toJSON');
			inst.toJSON.should.be.exactly(inst.toJson);
		});
		
		it('should return an object that is not an Instance', function () {
			var inst = new Instance();
			inst.toJSON().should.not.be.an.instanceOf(Instance);
		});
		
		it('should return an object with the values of the instance', function () {
			var inst = new Instance();
			
			inst.set('foo', 'bar');
			inst.set('baz', 'bin');
			
			var json = inst.toJSON();
			json.should.have.property('foo').which.is.exactly('bar');
			json.should.have.property('baz').which.is.exactly('bin');
		});
	});
	
	describe('#$addValidationError', function () {
		it('should add a validation error', function () {
			var inst = new Instance();
			inst.$addValidationError('testCol', 'test validation message', 'test validation type');
			inst.__validationErrors.length.should.equal(1);
			inst.__validationErrors[0].col.should.equal('testCol');
			inst.__validationErrors[0].message.should.equal('test validation message');
			inst.__validationErrors[0].type.should.equal('test validation type');
		});
		
		it('should allow multiple validation errors per column', function () {
			var inst = new Instance();
			inst.$addValidationError('testCol', 'test validation message');
			inst.$addValidationError('testCol', 'test validation message');
			inst.__validationErrors.length.should.equal(2);
		});
	});
	
	describe('#$removeValidationError', function () {
		it('should remove a validation error', function () {
			var inst = new Instance();
			
			inst.__validationErrors.push({col: 'testCol', message: '', type: ''});
			inst.__validationErrors.length.should.equal(1);
			inst.$removeValidationError('testCol');
			
			inst.__validationErrors.length.should.equal(0);
		});
		
		it('should remove all validation errors for column', function () {
			var inst = new Instance();
			
			inst.__validationErrors.push({col: 'testCol', message: '', type: ''});
			inst.__validationErrors.push({col: 'testCol', message: '', type: ''});
			inst.__validationErrors.length.should.equal(2);
			inst.$removeValidationError('testCol');
			
			inst.__validationErrors.length.should.equal(0);
		});
		
		it('should not remove validation errors for other columns', function () {
			var inst = new Instance();
			
			inst.__validationErrors.push({col: 'testCol', message: '', type: ''});
			inst.__validationErrors.push({col: 'testCol2', message: '', type: ''});
			inst.__validationErrors.length.should.equal(2);
			inst.$removeValidationError('testCol');
			
			inst.__validationErrors.length.should.equal(1);
		});
	});
	
	describe('#$clearValidationErrors', function () {
		it('should clear validation errors', function () {
			var inst = new Instance();
			
			inst.__validationErrors.push({col: 'testCol', message: '', type: ''});
			inst.__validationErrors.push({col: 'testCol2', message: '', type: ''});
			inst.__validationErrors.push({col: 'testCol3', message: '', type: ''});
			inst.__validationErrors.length.should.equal(3);
			inst.$clearValidationErrors();
			
			inst.__validationErrors.length.should.equal(0);
		});
	});
	
});