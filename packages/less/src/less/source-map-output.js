export default environment => {
    class SourceMapOutput {
        constructor(options) {
            this._css = [];
            this._rootNode = options.rootNode;
            this._contentsMap = options.contentsMap;
            this._contentsIgnoredCharsMap = options.contentsIgnoredCharsMap;
            if (options.sourceMapFilename) {
                this._sourceMapFilename = options.sourceMapFilename.replace(/\\/g, '/');
            }
            this._outputFilename = options.outputFilename;
            this.sourceMapURL = options.sourceMapURL;
            if (options.sourceMapBasepath) {
                this._sourceMapBasepath = options.sourceMapBasepath.replace(/\\/g, '/');
            }
            if (options.sourceMapRootpath) {
                this._sourceMapRootpath = options.sourceMapRootpath.replace(/\\/g, '/');
                if (this._sourceMapRootpath.charAt(this._sourceMapRootpath.length - 1) !== '/') {
                    this._sourceMapRootpath += '/';
                }
            } else {
                this._sourceMapRootpath = '';
            }
            this._outputSourceFiles = options.outputSourceFiles;
            this._sourceMapGeneratorConstructor = environment.getSourceMapGenerator();

            this._lineNumber = 0;
            this._column = 0;
        }

        removeBasepath(path) {
            if (this._sourceMapBasepath && path.indexOf(this._sourceMapBasepath) === 0) {
                path = path.substring(this._sourceMapBasepath.length);
                if (path.charAt(0) === '\\' || path.charAt(0) === '/') {
                    path = path.substring(1);
                }
            }

            return path;
        }

        normalizeFilename(filename) {
            filename = filename.replace(/\\/g, '/');
            filename = this.removeBasepath(filename);
            return (this._sourceMapRootpath || '') + filename;
        }

        add(chunk, fileInfo, index, mapLines) {
            // ignore adding empty strings
            if (!chunk) {
                return;
            }

            let lines;
            let sourceLines;
            let columns;
            let sourceColumns;
            let i;

            if (fileInfo && fileInfo.filename) {
                let inputSource = this._contentsMap[fileInfo.filename];

                // remove vars/banner added to the top of the file
                if (this._contentsIgnoredCharsMap[fileInfo.filename]) {
                    // adjust the index
                    index -= this._contentsIgnoredCharsMap[fileInfo.filename];
                    if (index < 0) { index = 0; }
                    // adjust the source
                    inputSource = inputSource.slice(this._contentsIgnoredCharsMap[fileInfo.filename]);
                }

                /** 
                 * ignore empty content, or failsafe
                 * if contents map is incorrect
                 */
                if (inputSource === undefined) {
                    this._css.push(chunk);
                    return;
                }

                inputSource = inputSource.substring(0, index);
                sourceLines = inputSource.split('\n');
                sourceColumns = sourceLines[sourceLines.length - 1];
            }

            lines = chunk.split('\n');
            columns = lines[lines.length - 1];

            if (fileInfo && fileInfo.filename) {
                if (!mapLines) {
                    this._sourceMapGenerator.addMapping({ generated: { line: this._lineNumber + 1, column: this._column},
                        original: { line: sourceLines.length, column: sourceColumns.length},
                        source: this.normalizeFilename(fileInfo.filename)});
                } else {
                    for (i = 0; i < lines.length; i++) {
                        this._sourceMapGenerator.addMapping({ generated: { line: this._lineNumber + i + 1, column: i === 0 ? this._column : 0},
                            original: { line: sourceLines.length + i, column: i === 0 ? sourceColumns.length : 0},
                            source: this.normalizeFilename(fileInfo.filename)});
                    }
                }
            }

            if (lines.length === 1) {
                this._column += columns.length;
            } else {
                this._lineNumber += lines.length - 1;
                this._column = columns.length;
            }

            this._css.push(chunk);
        }

        isEmpty() {
            return this._css.length === 0;
        }

        toCSS(context) {
            this._sourceMapGenerator = new this._sourceMapGeneratorConstructor({ file: this._outputFilename, sourceRoot: null });

            if (this._outputSourceFiles) {
                for (const filename in this._contentsMap) {
                    if (this._contentsMap.hasOwnProperty(filename)) {
                        let source = this._contentsMap[filename];
                        if (this._contentsIgnoredCharsMap[filename]) {
                            source = source.slice(this._contentsIgnoredCharsMap[filename]);
                        }
                        this._sourceMapGenerator.setSourceContent(this.normalizeFilename(filename), source);
                    }
                }
            }

            this._rootNode.genCSS(context, this);

            if (this._css.length > 0) {
                let sourceMapURL;
                const sourceMapContent = JSON.stringify(this._sourceMapGenerator.toJSON());

                if (this.sourceMapURL) {
                    sourceMapURL = this.sourceMapURL;
                } else if (this._sourceMapFilename) {
                    sourceMapURL = this._sourceMapFilename;
                }
                this.sourceMapURL = sourceMapURL;

                this.sourceMap = sourceMapContent;
            }

            return this._css.join('');
        }
    }

    return SourceMapOutput;
};
