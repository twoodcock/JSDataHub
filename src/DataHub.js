/*
 * **************************************************************************
 * *** This is an experimental implementation, as yet untested.
 * *** There are syntax errors.
 * *** There is missing code.
 * *** I have used this type of data hub in a production enviornment before,
 * *** just not in javascript. (The idea adapts to many languages.)
 * **************************************************************************
 *
 * DataHub : Fount of all knowledge, source of all data.
 * The idea is to provide a DSL that the application can used that completely
 * decouples data from the application. This is done by providing a set of
 * classes accessed through a root class.
 *
 * Note: I am sure someone has done this before and named it something other
 * than 'data hub'.
 *
 * Constraints:
 * - The application imports the data hub and only the data hub.
 * - The application gets access to data in a human readable way.
 *
 * This type of class is application specific. As such, this is mostly just an
 * example of the code. There are some generics that can be tested. Notably, I
 * have used a generic factory class that does the caching necessary. The use
 * of the generic class means that caching can be implemented and tested once.
 * Testing the caching feature on live classes should be unncessary.
 *
 * (Write code that is easy to change, design code that never has to.
 *  Write code that is easy to test, design code so it is already tested.)
 *
 * Expected Usage:
 *
 * Note: The API is going to return promises rather than actual data. I have
 *       left out 'then' and 'cache' logistics.
 *
 *    import dataHub from './path/to/custom/datahub';
 *
 *    newClient = dataHub.client.create(createAttributes);
 *    clientList = dataHub.client.list();
 *    specificClient = dataHub.client.get({id: clientId});
 *    specificClient.update(newAttributes);
 *    specificClient.delete();
 *
 * Because the data hub uses caching, we don't have to pass the client around.
 * 
 *    invoiceList = dataHub.client.get({id: clientId}).invoiceList();
 *    invoice = dataHub.client({id: clientId}).invoice({id: invoiceNumber});
 *
 * If we ask for something that isn't cached, the data hub will take care of
 * fetching it through the API. If there is a failure in the chain the
 * application will get the appropriate exception. As long as we take care of
 * that exception these requests will work.
 *
 * Let's add promise syntax into this - let's say we're in react. The reaction
 * to a fulfilled promise is going to be to set the state.
 *
 *    invoiceList = dataHub.client.get({id: clientId}).invoiceList()
 *    .then((list)=>{ this.setState({ invoiceList: list }) })
 *    .catch((reason) => {
 *      this.setState({ error: reason });
 *    });
 *    invoice = dataHub.client({id: clientId}).invoice({id: invoiceNumber})
 *    .then((invoice)=>{ this.setState({ invoice: invoice }) })
 *    .catch((reason) => {
 *      this.setState({ error: reason });
 *    });
 *
 * If we are using react and thinking reactively, we'll have the client in our
 * component's props so we don't need the cache to access the invoices. The
 * code lines are shorter, simpler, but the result is much the same:
 *
 *    invoiceList = this.props.client.invoiceList()
 *    .then(...)
 *    .catch(...);
 *    invoice = this.props.client.invoice({id: invoiceNumber})
 *    .then(...)
 *    .catch(...);
 *
 */

import Cache from './Cache';
import GenericFactory from './GenericFactory';
import Listenable from './Listenable';

/*
 * This is the data hub. It is just a class that provides us with a DSL.
 *
 * It is useful to enhance the DSL by adding DSL elements to an invoice. For
 * example, in this case, I am creating a mixin for the client object that
 * adds to the DSL. Lets look at the intended usage:
 *
 * Usage:
 *
 * dataHub = DataHub();
 * clientList = dataHub.client.list();
 * client = dataHub.client.get(clientId);
 * client = dataHub.client.create(createParams):
 * invoiceList = client.invoice.list();
 * invoice = client.invoice.get(invoiceId);
 *
 */
class DataHub {
  /* The hub root is a simple class that provides the root for our DSL. */
  constructor() {
    this.clientFactory = new ClientFactory();
  }
  get client() { return this.clientFactory; }
}

/*
 * Here is a custom mixin to turn the client object into a hub for client-
 * related data. The interface for the factory that creates related data
 * objects needs to accept the client as a parameter.
 */
class ClientHubMixin {
  /* We build hubs for client relations */
  constructor() {
    this.invoiceFactory = new InvoiceFactory({client: this});
  }
  get invoice() { return this.invoiceFactory; }

}

/*
 * Here is our client factory. We just need to extend a generic factory
 * (defined below) that gives us get, list, and create methods.
 */
class clientFactory extends GenericFactory {
  constructor(props) {
    super({
      objClass: Client,
      listClass: ClientList,
      objCache: new Cache({ size: 5, keyAttributes: ['cid']}),
      listCache: new Cache({ size: 1}),
    })
    this.props = props;
  }
}

/*
 * Here is our invoice factory. Again, we extend the generic factory. Note
 * this time though, we need to update the implementation methods to deliver
 * client information to the API. (We could also build an API that allows us
 * to create an instance that already knows which client we are talking to.)
 */
class invoiceFactory extends GenericFactory {
  constructor(props) {
    super({
      objClass: Invoice,
      listClass: InvoiceList,
      objCache: new Cache({ size: 5, keyAttributes: ['cid']}),
      listCache: new Cache({ size: 1}),
    })
    this.props = props;
    if (props.client instanceof Client) {
      throw MissingAttributeError("InvoiceFactory nees a client to work with!")
    }
  }

  list(props) {
    super.list({...props, cid: this.props.client.cid})
  }

  get(props) {
    super.get({...props, cid: this.props.client.cid})
  }

  create(props) {
    super.create({...props, cid: this.props.client.cid})
  }
}

// An error class that allows us to be specific about our error (syntax might
// not work yet.)
class MissingAttributeError extends Error {}


/*
 * Client: provide a data source for this client.
 * Usage:
 *
 *    dataHub.client.list().then((list) => {
 *      // things to do with client list.
 *    })
 *    dataHub.client.get({ cid: cid }).then((client) => {
 *      // things to do after loading client 
 *    }).catch((reason) => {
 *      // things to do on failure.  
 *    })
 *   
 *    string = client.cid;
 *    string = client.name;
 *    string = client.description;
 *    string = client.description_raw; (if available)
 *    listOfObjects = client.project_set;
 *    
 *    client.addListener('onUpdate', ()=>{
 *       console.log("updated: "+client.name)
 *    })
 *
 *    client.name(string);
 *    client.description_raw(string);
 *    client.update().then(()=>{
 *        // things to do after update....
 *    });
 *    // also, in the console: "updated: clientname".
 *
 *    dataHub.client.create({
 *      cid: string,
 *      name: string,
 *      description_raw: string
 *    }).then((client)=>{
 *       // things to do with new client....
 *    })
 *
 *    dataHub.invoice.list(props).then((list) => {
 *      // things to do with an invoice list.
 *    })
 *    dataHub.invoice.get({id: id}).then((invoice) => {
 *      // things to do with an invoice.
 *    }).catch((reason)=>{
 *      // things to do on failure.
 *    })
 *    
 *    number = invoice.num;
 *    number = invoice.subtotal;
 *    number = invoice.total;
 *    list = invoice.lineItems;
 */
class Client extends Listenable {
  constructor(props) {
    this.props = props;
    this.listener = {
      change: [],
    };
    this.get(props.cid);
  }

  get cid() { return this.props.cid }
  get name() { return this.props.name }
  get description() { return this.props.description }
  get description_raw() { return this.props.description_raw }
  get project_set() { return this.props.project_set }

  set name(value) {
    const rv = this.props.name;
    this.props.name = value;
    this.onChange();
    return rv;
  }
  set description_raw(value) {
    const rv = this.props.description_raw;
    this.props.description_raw = value;
    this.onChange();
    return rv;
  }

  create() {
    return this.props.API.createClient(props).then((data) => {
      this.props = data;
      this.onCreate(data);
      return this;
    });
  }
  get() {
    return this.props.API.getClient({cid: props.cid})
    .then((data) => {
      this.props = data;
      this.onLoad(data);
      return this;
    });
  }
  update() {
    return this.props.API.updateClient({
      cid: cid
    }, {
      name: this.name,
      description_raw: this.description_raw
    })
    .then((data) => {
      this.onUpdate(data);
      return data;
    });
  }
}

class Invoice extends Listenable {
  constructor(props) {
    this.props = props;
  }
  create() {
    return API.createInvoice(this.props).then((data) => {
      this.data = data;
      this.onCreate();
      this.onLoad();
      return this;
    });

  }
  get() {
    return API.get(this.props)
    .then((data) => {
      this.data = data;
      this.onLoad();
      return this;
    })
  }
  update(myProps) {
    // update(record-id, fields-to-update)
    return API.update(this.props, myProps)
    .then((data) => {
      // this.data = data?
      this.onUpdate();
      return this;
    })
  }
}


class ClientList extends Listenable {
    constructor(props) {
        super(props);
        this.props = props; 
    }
    get(props) {
        return this.props.API.getClientList(props)
        .then((list) => {
            this.list = list;
            this.onLoad(data);
            return this;
        });
    }

}