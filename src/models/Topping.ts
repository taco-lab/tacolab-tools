export class Topping {
    constructor(public id: number,
                public name: string,
                public image_version?: {image: {name: string, is_deployable: boolean}}) {}
}