export interface LinkCoverageVariantLabels {
     saveCoverageButtonlabel: string;
    clearButtonLabel: string;
    header:string;
}
export interface CoverageVariantResponse {
    predefinedAttributeId: string,
    attributeDescription: string,
    category: string,
    productClasses: string,
    dataType: string,
    standardCoverage: StandardCoverage[]
}
export interface StandardCoverage {
    standardCoverageCode: string,
    standardCoverageDescription: string
}
export interface coverageVariantData{
    country: string
    coverageVariantId: string
    coverageVariantName: string
    standardCoverage: string[]
    productClass: string
    updatedBy?: string
    updatedOn: string
}
