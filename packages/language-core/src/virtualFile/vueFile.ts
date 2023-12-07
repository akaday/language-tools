import { Stack, VirtualFile, forEachEmbeddedFile } from '@volar/language-core';
import type * as ts from 'typescript/lib/tsserverlibrary';
import { VueCompilerOptions, VueLanguagePlugin } from '../types';
import { computedFiles } from './computedFiles';
import { computedMappings } from './computedMappings';
import { computedSfc } from './computedSfc';
import { computedVueSfc } from './computedVueSfc';
import { Signal, signal } from 'computeds';

const jsxReg = /^\.(js|ts)x?$/;

export class VueFile implements VirtualFile {

	// sources

	_snapshot: Signal<ts.IScriptSnapshot>;

	// computeds

	getVueSfc = computedVueSfc(this.plugins, this.id, () => this._snapshot());
	sfc = computedSfc(this.ts, this.plugins, this.id, () => this._snapshot(), this.getVueSfc);
	getMappings = computedMappings(() => this._snapshot(), this.sfc);
	getEmbeddedFiles = computedFiles(this.plugins, this.id, this.sfc, this.codegenStack);

	// others

	codegenStacks: Stack[] = [];
	get embeddedFiles() {
		return this.getEmbeddedFiles();
	}
	get mainTsFile() {
		for (const file of forEachEmbeddedFile(this)) {
			if (file.typescript && file.id.substring(this.id.length).match(jsxReg)) {
				return file;
			}
		}
	}
	get snapshot() {
		return this._snapshot();
	}
	get mappings() {
		return this.getMappings();
	}

	constructor(
		public id: string,
		public languageId: string,
		public initSnapshot: ts.IScriptSnapshot,
		public vueCompilerOptions: VueCompilerOptions,
		public plugins: ReturnType<VueLanguagePlugin>[],
		public ts: typeof import('typescript/lib/tsserverlibrary'),
		public codegenStack: boolean,
	) {
		this._snapshot = signal(initSnapshot);
	}

	update(newSnapshot: ts.IScriptSnapshot) {
		this._snapshot.set(newSnapshot);
	}
}