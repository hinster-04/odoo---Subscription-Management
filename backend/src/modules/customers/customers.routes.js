const express = require('express');
const customersController = require('./customers.controller');

const router = express.Router();

router.get('/meta/summary', customersController.getMetadata);
router.get('/', customersController.listCustomers);
router.get('/:id', customersController.getCustomer);
router.put('/:id', customersController.updateCustomer);
router.patch('/:id/status', customersController.toggleCustomerStatus);

module.exports = router;
