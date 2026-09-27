const express = require('express');
const swaggerUi = require('swagger-ui-express');
const openapiDocument = require('./openapi');
const salesRouter = require('./routes/sales');
const purchasesRouter = require('./routes/purchases');
const creditSalesRouter = require('./routes/creditSales');
const creditPaymentsRouter = require('./routes/creditPayments');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ name: 'Sunanda Stores API', status: 'ok' });
});
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));
app.get('/openapi.json', (req, res) => res.json(openapiDocument));

app.use('/sales', salesRouter);
app.use('/purchases', purchasesRouter);
app.use('/credit-sales', creditSalesRouter);
app.use('/credit-payments', creditPaymentsRouter);

app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} was not found.` });
});

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body must contain valid JSON.' });
  }
  return next(error);
});

const port = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(port, () => console.log(`Sunanda Stores API listening on port ${port}`));
}

module.exports = app;