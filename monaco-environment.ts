(self as any).MonacoEnvironment = {
    getWorker(moduleId: string, label: string) {
        let url = '';

        switch (label) {
            case 'json':
                url = '/assets/monaco/json.worker.js';
                break;
            case 'css':
                url = '/assets/monaco/css.worker.js';
                break;
            case 'html':
                url = '/assets/monaco/html.worker.js';
                break;
            case 'typescript':
            case 'javascript':
                url = '/assets/monaco/ts.worker.js';
                break;
            case 'java':
                url = '/assets/monaco/language/java/java.worker.js';
                break;
            case 'python':
                url = '/assets/monaco/language/python/python.worker.js';
                break;
            default:
                url = '/assets/monaco/editor.worker.js';
        }

        // important: module workers -> use type module
        return new Worker(url, { type: 'module' });
    }
};

