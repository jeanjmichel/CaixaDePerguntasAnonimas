const handler = {
  get(_target: Record<string, string>, name: string) {
    return name;
  },
};

export default new Proxy({} as Record<string, string>, handler);
