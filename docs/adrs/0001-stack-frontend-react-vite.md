# ADR 0001: Stack del frontend

## Estado

Aceptado (heredado)

## Contexto

El PRD (ArmalyTech — Panel de Tickets e Inventario Web) agrega un panel administrativo, tickets de
reparación e inventario a un sitio web existente. El repositorio actual ya es una aplicación de
una sola página (SPA) construida con React 18 + Vite 5 + Tailwind CSS 3, con enrutamiento
(react-router-dom), y está desplegado en Vercel.

## Decisión

Mantener el frontend tal como está: React + Vite + Tailwind CSS, extendiendo la SPA existente con
las rutas y vistas nuevas del panel admin y del seguimiento público de tickets.

## Consecuencias

- No se introduce tecnología nueva en el frontend: el equipo de una persona sigue trabajando con el
  stack que ya conoce y que ya está funcionando en producción.
- El frontend crece con rutas y estados nuevos (login, panel, vista pública de ticket), pero sin
  cambios de herramienta ni migraciones de dependencias.
- Trade-off: al ser una SPA, el contenido no es indexable por SEO de forma nativa; irrelevante para
  las secciones del panel y del seguimiento, que son privadas o de acceso por enlace directo.