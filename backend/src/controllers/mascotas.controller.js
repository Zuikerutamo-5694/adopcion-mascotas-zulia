const { validationResult } = require('express-validator');
const mascotasService = require('../services/mascotas.service');

async function create(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        data: errors.array(),
        message: errors.array()[0]?.msg || 'Errores de validación',
      });
    }

    const mascota = await mascotasService.create(req.body, req.user.id_usuario);

    res.status(201).json({
      success: true,
      data: mascota,
      message: 'Mascota registrada exitosamente',
    });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        data: errors.array(),
        message: errors.array()[0]?.msg || 'Errores de validación',
      });
    }

    const result = await mascotasService.list(req.query);

    res.json({
      success: true,
      data: result,
      message: 'Mascotas obtenidas exitosamente',
    });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        data: errors.array(),
        message: errors.array()[0]?.msg || 'Errores de validación',
      });
    }

    const mascota = await mascotasService.getById(req.params.id);

    res.json({
      success: true,
      data: mascota,
      message: 'Mascota obtenida exitosamente',
    });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        data: errors.array(),
        message: errors.array()[0]?.msg || 'Errores de validación',
      });
    }

    const mascota = await mascotasService.update(req.params.id, req.body, req.user);

    res.json({
      success: true,
      data: mascota,
      message: 'Mascota actualizada exitosamente',
    });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        data: errors.array(),
        message: errors.array()[0]?.msg || 'Errores de validación',
      });
    }

    await mascotasService.remove(req.params.id, req.user);

    res.json({
      success: true,
      data: null,
      message: 'Mascota eliminada exitosamente',
    });
  } catch (err) {
    next(err);
  }
}

async function uploadPhotos(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        data: errors.array(),
        message: errors.array()[0]?.msg || 'Errores de validación',
      });
    }

    const files = [
      ...(req.files?.foto || []),
      ...(req.files?.fotos || []),
    ];

    if (files.length === 0 && !req.body.url_imagen) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Debes subir al menos una imagen o proporcionar una URL válida',
      });
    }

    const photos = await mascotasService.uploadPhotos(
      req.params.id,
      files,
      req.body.es_principal_index,
      req.user,
      req.body.url_imagen
    );

    res.status(201).json({
      success: true,
      data: photos,
      message: 'Fotos guardadas exitosamente',
    });
  } catch (err) {
    next(err);
  }
}

async function setPrincipalPhoto(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        data: errors.array(),
        message: errors.array()[0]?.msg || 'Errores de validación',
      });
    }

    const photo = await mascotasService.setPrincipalPhoto(req.params.id, req.params.fotoId, req.user);
    res.json({
      success: true,
      data: photo,
      message: 'Foto principal actualizada',
    });
  } catch (err) {
    next(err);
  }
}

async function deletePhoto(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        data: errors.array(),
        message: errors.array()[0]?.msg || 'Errores de validación',
      });
    }

    await mascotasService.deletePhoto(req.params.id, req.params.fotoId, req.user);
    res.json({
      success: true,
      data: null,
      message: 'Foto eliminada exitosamente',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create,
  list,
  getById,
  update,
  remove,
  uploadPhotos,
  setPrincipalPhoto,
  deletePhoto,
};
