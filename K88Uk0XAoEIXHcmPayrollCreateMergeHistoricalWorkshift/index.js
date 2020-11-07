
/**
 * Nome da primitiva : createMergeHistoricalWorkshift
 * Nome do dominio : hcm
 * Nome do serviço : payroll
 * Nome do tenant : trn94657786
 **/


const axios = require('axios');

exports.handler = async event => {
  
    let body = parseBody(event);
    let tokenSeniorX = event.headers['X-Senior-Token'];
    let userSeniorX = event.headers['X-Senior-User'];

    const instance = axios.create({
        baseURL: 'https://platform-homologx.senior.com.br/t/senior.com.br/bridge/1.0/rest/',
        headers: {
          'Authorization': tokenSeniorX
        }
    });
    
    
    //Dados do Colaborador para identificar os dados da escala antiga
    if(body.employee){
        let employee = await instance.get(`/hcm/payroll/entities/employee/${body.employee.id}`);
       
        if(employee.data.workshift){
            let workshiftAntiga = await instance.get(`/hcm/payroll/entities/workshift/${employee.data.workshift}`);
            
            //Dados da Escala Nova
            if(body.workshiftId.id){
                let workshiftNova = await instance.get(`/hcm/payroll/entities/workshift/${body.workshiftId.id}`);
               
                if(workshiftAntiga.data.monthminutes !== workshiftNova.data.monthminutes){
                    
                    //Verifica usuário se está no papel RH
                    let userRoles = await instance.post('/platform/authorization/queries/getUserDetailRoles', { user: userSeniorX });
  
                    //percorre e filtra os papeis retornando apenas os que possuem RH
                    userRoles = userRoles.data.roles.filter(role => {
                        return role.name === 'RH';
                    });
                    
                    if(userRoles.length === 0){
                        return sendRes(400,'Usuário sem permissão para troca de escala com carga horária Mês diferente da anterior. Para alteração contate o RH.');
                    }
                }
            }
        }
    }
    
    /*Caso todas as validações passem, retorno OK*/
    return sendRes(200,body);
    
};

const parseBody = (event) => {
    return typeof event.body === 'string' ?  JSON.parse(event.body) : event.body || {};
};

const sendRes = (status, body) => {
    var response = {
      statusCode: status,
      headers: {
        "Content-Type": "application/json"
      },
      body: typeof body === 'string' ? body : JSON.stringify(body) 
    };
    return response;
};