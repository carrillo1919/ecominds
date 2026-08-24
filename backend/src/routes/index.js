const express = require('express');
const buildCrudRouter = require('./crudRouterFactory');
const enteReguladorController = require('../controllers/enteReguladorController');
const requisitoLegalController = require('../controllers/requisitoLegalController');
const empresaController = require('../controllers/empresaController');
const empresaRequisitoController = require('../controllers/empresaRequisitoController');

const router = express.Router();

router.get('/health', (_req, res) => res.json({ ok: true }));
router.use('/entes-reguladores', buildCrudRouter(enteReguladorController));
router.use('/requisitos-legales', buildCrudRouter(requisitoLegalController));
router.use('/empresa-requisitos', buildCrudRouter(empresaRequisitoController));

const empresasRouter = express.Router();
empresasRouter.get('/with-requisitos/all', empresaController.listWithRequisitos);
empresasRouter.get('/:id/with-requisitos', empresaController.getByIdWithRequisitos);
empresasRouter.get('/', empresaController.list);
empresasRouter.get('/:id', empresaController.getById);
empresasRouter.post('/', empresaController.create);
empresasRouter.put('/:id', empresaController.update);
empresasRouter.delete('/:id', empresaController.remove);
router.use('/empresas', empresasRouter);

module.exports = router;
