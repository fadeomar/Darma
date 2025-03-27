const normalizeParam = (param: string | string[] | undefined): string[] =>
  param ? (Array.isArray(param) ? param : [param]) : [];

export default normalizeParam;
