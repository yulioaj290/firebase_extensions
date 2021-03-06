"use strict";
/**
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const handlebars_1 = require("handlebars");
const firebase_functions_1 = require("firebase-functions");
class Templates {
    constructor(collection) {
        this.collection = collection;
        this.collection.onSnapshot(this.updateTemplates.bind(this));
        this.templateMap = {};
        this.ready = false;
        this.waits = [];
    }
    waitUntilReady() {
        if (this.ready) {
            return Promise.resolve();
        }
        return new Promise((resolve) => {
            this.waits.push(resolve);
        });
    }
    updateTemplates(snap) {
        snap.docs.forEach((doc) => {
            const data = doc.data();
            const templates = {};
            if (data.subject) {
                templates.subject = handlebars_1.compile(data.subject, { noEscape: true });
            }
            if (data.html) {
                templates.html = handlebars_1.compile(data.html);
            }
            if (data.text) {
                templates.text = handlebars_1.compile(data.text, { noEscape: true });
            }
            if (data.amp) {
                templates.amp = handlebars_1.compile(data.amp);
            }
            this.templateMap[doc.id] = templates;
            firebase_functions_1.logger.log(`loaded template '${doc.id}'`);
        });
        this.ready = true;
        this.waits.forEach((wait) => wait());
    }
    async render(name, data) {
        await this.waitUntilReady();
        if (!this.templateMap[name]) {
            return Promise.reject(new Error(`tried to render non-existent template '${name}'`));
        }
        const t = this.templateMap[name];
        return {
            subject: t.subject ? t.subject(data) : null,
            html: t.html ? t.html(data) : null,
            text: t.text ? t.text(data) : null,
            amp: t.amp ? t.amp(data) : null,
        };
    }
}
exports.default = Templates;
