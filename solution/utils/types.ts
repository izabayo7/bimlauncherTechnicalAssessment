export interface RegisterSchema {
  projectWideAutoNumberingEnabled: boolean;
  projectName: string;
  projectId: number;
  basicAutoNumberingEnabled: boolean;
  autoNumberingEnabled: boolean;
  EntityCreationSchemaFields: {
    MultiValueSchemaField: {
      Attributes: {
        EntityField: {
          MandatoryStatus: string;
        };
      };
      DataType: string;
      FieldName: string;
      Identifier: string;
      ModifiedFieldName?: string;
      SchemaValues?: {
        SchemaValue: {
          AutoNumberScheme?: string[];
          Id?: string[];
          Value: string;
        }[];
      };
    }[];
    SingleValueSchemaField: {
      Attributes: {
        EntityField: {
          MandatoryStatus: string;
        };
      };
      DataType: string;
      FieldName: string;
      Identifier: string;
      ModifiedFieldName?: string;
    }[];
  };
}

export interface DownloadResult {
  data: string;
  filename: string;
}

export interface Document {
  DocumentId: string;
  DocumentNumber: string;
  DocumentTypeId: number;
  Revision: string;
  DocumentStatusId: number;
  HasFile: boolean;
  Title: string;
  Discipline?: "Architectural";
  Filename?: string;
}

export type SearchResponse = {
  RegisterSearch: {
    $: {
      TotalResults: string;
    };
    SearchResults: {
      Document: {
        $: {
          DocumentId: string;
        };
        Discipline: string[];
        DocumentNumber: string[];
        Filename: string[];
        Revision: string[];
        Title: string[];
      }[];
    }[];
  };
};