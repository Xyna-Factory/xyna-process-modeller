/*
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Copyright 2023 Xyna GmbH, Germany
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 */
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

