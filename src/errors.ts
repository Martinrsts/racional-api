export class EmailAlreadyInUseError extends Error {
  constructor() {
    super('Este mail ya está en uso por otro usuario');
    this.name = 'EmailAlreadyInUseError';
  }
}
