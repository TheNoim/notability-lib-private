const canvas = document.getElementById('plot');

fetch('data.json')
    .then(result => result.json())
    .then(data => {
        const zoomFactor = 8;

        let width = 600 * zoomFactor;
        let height = 6000 * zoomFactor;

        // for (const arr of data) {
        //     for (let i = 0; i < arr.points.length; i++) {
        //         const x = arr.points[i].x;
        //         const y = arr.points[i].y;
        //         if (width < x) width = x;
        //         if (height < y) height = y;
        //     }
        // }
        //
        // for (const media of medias) {
        //     const {x,y} = media.end;
        //     if (width < x) width = x;
        //     if (height < y) height = y;
        // }

        canvas.width = width;
        canvas.height = height;

        if (canvas.getContext) {
            var ctx = canvas.getContext('2d');

            function drawPoint(coordinate, color = 'red') {
                const {x,y} = coordinate;
                ctx.beginPath();
                ctx.arc(x * zoomFactor, y * zoomFactor, zoomFactor, 0, 2 * Math.PI)
                ctx.stroke();
                ctx.fillStyle = color;
                ctx.fill();
                ctx.closePath()
            }

            const NTypes = {
                CURVE: 0,
                SHAPE: 1,
                MEDIA: 2,
            };

            for (let i = 0; i < data.length; i++) {
                const instruction = data[i];
                const ntype = instruction['@NType'];
                console.log({ ntype })
                switch (ntype) {
                    case NTypes.MEDIA:
                        const path = instruction.path;
                        const img = document.createElement('img', { src: path, id: 'img1' });
                        img.src = path;
                        img.id = 'img' + i;
                        img.style = 'display: none;';
                        img.onload = function () {
                            const {x,y} = instruction.origin;
                            const {width, height} = instruction.dimension;
                            ctx.drawImage(document.getElementById('img' + i), x * zoomFactor, y * zoomFactor, width * zoomFactor, height * zoomFactor);
                        }
                        document.body.appendChild(img)
                        break;
                    case NTypes.CURVE: {
                        console.warn({ instruction });
                        if (instruction.width) {
                            ctx.lineWidth = instruction.width * zoomFactor;
                        }
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(${instruction.color.r}, ${instruction.color.g}, ${instruction.color.b}, ${instruction.color.a})`;
                        for (let i = 0; i < instruction.points.length; i++) {
                            const x = instruction.points[i].x * zoomFactor;
                            const y = instruction.points[i].y * zoomFactor;
                            if (i === 0) {
                                ctx.moveTo(x, y);
                            } else {
                                ctx.lineTo(x, y)
                            }
                        }
                        ctx.stroke();
                        ctx.closePath();
                        ctx.lineWidth = zoomFactor;
                        console.warn({ instruction })
                        break;
                    }
                    case NTypes.SHAPE:
                        switch (instruction.type) {
                            case 'line': {
                                const {start, end, style} = instruction;
                                if (style.strokeWidth) {
                                    ctx.lineWidth = style.strokeWidth * zoomFactor;
                                }
                                ctx.beginPath();
                                ctx.moveTo(start.x * zoomFactor, start.y * zoomFactor);
                                ctx.lineTo(end.x * zoomFactor, end.y * zoomFactor);
                                ctx.strokeStyle = `rgba(${instruction.style.strokeColor.r}, ${instruction.style.strokeColor.g}, ${instruction.style.strokeColor.b}, ${instruction.style.strokeColor.a})`;
                                ctx.stroke();
                                ctx.closePath();
                                ctx.lineWidth = 1 * zoomFactor;
                                break;
                            }
                            case 'rectangle':
                                const {points} = instruction;
                                ctx.beginPath();
                                for (let i = 0; i < points.length; i++) {
                                    const x = points[i].x * zoomFactor;
                                    const y = points[i].y * zoomFactor;
                                    if (i === 0) {
                                        ctx.moveTo(x, y);
                                    } else {
                                        ctx.lineTo(x, y)
                                    }
                                }
                                ctx.lineTo(points[0].x * zoomFactor, points[0].y * zoomFactor);
                                ctx.stroke();
                                ctx.closePath();
                                break;
                            case 'circle':
                                const {center, radius, debugPoints} = instruction;
                                ctx.beginPath();
                                ctx.arc(center.x * zoomFactor, center.y * zoomFactor, radius * zoomFactor, 0, 2 * Math.PI);
                                ctx.stroke();
                                ctx.closePath();
                                // if (debugPoints && debugPoints.length) {
                                //     for (const point of debugPoints) {
                                //         drawPoint(point);
                                //     }
                                // }
                                break;
                            case 'ellipse':
                                const {center: centerEllipse, radiusX, radiusY, rotation, debugPoints: debugPointsEllipse} = instruction;
                                ctx.beginPath();
                                const rot = rotation;
                                console.log(rot);
                                ctx.ellipse(centerEllipse.x * zoomFactor, centerEllipse.y * zoomFactor, radiusX * zoomFactor, radiusY * zoomFactor, rot,0, 2 * Math.PI);
                                ctx.stroke();
                                ctx.closePath();
                                // if (debugPointsEllipse && debugPointsEllipse.length) {
                                //     for (const point of debugPointsEllipse) {
                                //         drawPoint(point);
                                //     }
                                // }
                                break;
                            case 'partialshape': {
                                const {debugPoints: debugPointsPartialShape, corners, rect, strokePath, outlinePath,style} = instruction;
                                // if (debugPointsPartialShape && debugPointsPartialShape.length) {
                                //     // for (const point of debugPointsPartialShape) {
                                //     //     drawPoint(point);
                                //     // }
                                //     let afterInstr = [];
                                //     ctx.beginPath();
                                //     let lastInstr;
                                //     for (let i = 0; i < debugPointsPartialShape.length; i += 2) {
                                //         let p1 = debugPointsPartialShape[i];
                                //         let p2 = debugPointsPartialShape[i+1];
                                //         afterInstr.push(() => drawPoint(p1, 'rgb(139, 69, 19)'));
                                //         afterInstr.push(() => drawPoint(p2, 'rgb(0, 100, 0)'));
                                //         if (i === 0) {
                                //             ctx.moveTo(p1.x * zoomFactor, p1.y * zoomFactor);
                                //             lastInstr = () => ctx.lineTo(p2.x * zoomFactor, p2.y * zoomFactor);
                                //         } else {
                                //             ctx.lineTo(p2.x * zoomFactor, p2.y * zoomFactor);
                                //             if (i === debugPointsPartialShape.length - 1 && lastInstr) {
                                //                 lastInstr();
                                //             }
                                //         }
                                //     }
                                //     ctx.strokeStyle = "red";
                                //     ctx.stroke();
                                //     ctx.closePath();
                                //     for (const ins of afterInstr) {
                                //         ins();
                                //     }
                                // }
                                // if (corners && corners.length) {
                                //     for (const cornerPoint of corners) {
                                //         drawPoint(cornerPoint, 'rgb(112, 128, 144)');
                                //     }
                                // }
                                // if (rect && rect.length) {
                                //     for (const recPoint of rect) {
                                //         drawPoint(recPoint, 'yellow');
                                //     }
                                // }

                                /*ctx.beginPath();

                                for (const cgInst of strokePath.instructions) {
                                    /!**
                                     * ctx.moveTo(start.x * zoomFactor, start.y * zoomFactor);
                                     * ctx.lineTo(end.x * zoomFactor, end.y * zoomFactor);
                                     *!/
                                    const type = cgInst.type;
                                    const to = cgInst.to;
                                    switch (type) {
                                        case 0 /!*CGPathInstructionType.MOVE_TO*!/: {
                                            ctx.moveTo(to.x * zoomFactor, to.y * zoomFactor);
                                            break;
                                        }
                                        case 1 /!*CGPathInstructionType.ADD_LINE*!/: {
                                            ctx.lineTo(to.x * zoomFactor, to.y * zoomFactor);
                                            break;
                                        }
                                        case 2 /!*CGPathInstructionType.ADD_QUAD_CURVE*!/: {
                                            const control = cgInst.control;
                                            ctx.quadraticCurveTo(control.x * zoomFactor, control.y * zoomFactor, to.x * zoomFactor, to.y * zoomFactor);
                                            break;
                                        }
                                        case 3 /!*CGPathInstructionType.ADD_CURVE*!/: {
                                            const control1 = cgInst.control1;
                                            const control2 = cgInst.control1;
                                            ctx.bezierCurveTo(control1.x * zoomFactor, control1.y * zoomFactor, control2.x * zoomFactor, control2.y * zoomFactor, to.x * zoomFactor, to.y * zoomFactor);
                                            break;
                                        }
                                    }
                                }

                                ctx.fillStyle = `rgba(${instruction.style.strokeColor.r}, ${instruction.style.strokeColor.g}, ${instruction.style.strokeColor.b}, ${instruction.style.strokeColor.a})`;
                                ctx.fill();
                                ctx.closePath();*/

                                if (style.strokeWidth) {
                                    ctx.lineWidth = style.strokeWidth;
                                }
                                ctx.beginPath();

                                for (const cgInst of outlinePath.instructions) {
                                    /**
                                     * ctx.moveTo(start.x * zoomFactor, start.y * zoomFactor);
                                     * ctx.lineTo(end.x * zoomFactor, end.y * zoomFactor);
                                     */
                                    const type = cgInst.type;
                                    const to = cgInst.to;
                                    switch (type) {
                                        case 0 /*CGPathInstructionType.MOVE_TO*/: {
                                            ctx.moveTo(to.x * zoomFactor, to.y * zoomFactor);
                                            break;
                                        }
                                        case 1 /*CGPathInstructionType.ADD_LINE*/: {
                                            ctx.lineTo(to.x * zoomFactor, to.y * zoomFactor);
                                            break;
                                        }
                                        case 2 /*CGPathInstructionType.ADD_QUAD_CURVE*/: {
                                            const control = cgInst.control;
                                            ctx.quadraticCurveTo(control.x * zoomFactor, control.y * zoomFactor, to.x * zoomFactor, to.y * zoomFactor);
                                            break;
                                        }
                                        case 3 /*CGPathInstructionType.ADD_CURVE*/: {
                                            const control1 = cgInst.control1;
                                            const control2 = cgInst.control1;
                                            ctx.bezierCurveTo(control1.x * zoomFactor, control1.y * zoomFactor, control2.x * zoomFactor, control2.y * zoomFactor, to.x * zoomFactor, to.y * zoomFactor);
                                            break;
                                        }
                                    }
                                }

                                ctx.strokeStyle = `rgba(${instruction.style.strokeColor.r}, ${instruction.style.strokeColor.g}, ${instruction.style.strokeColor.b}, ${instruction.style.strokeColor.a})`;
                                ctx.lineCap = "round";
                                ctx.stroke();
                                ctx.closePath();
                                ctx.strokeWidth = 1 * zoomFactor;

                                break;
                            }
                            default:
                                console.warn('Unknown shape type: ', instruction);
                                break;
                        }
                        break;
                    default:
                        console.warn('Unknown draw instruction: ', instruction);
                        break;
                }
            }
        }
    });
