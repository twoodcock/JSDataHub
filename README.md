# JSDataHub

This is a (currently experimental) data hub implementation fragment.

# Class Name:

DataHub : Fount of all knowledge, source of all data.

# Summary

This project is about delivering a DSL (domain specific language) that
decouples the data and API from the application. (I am sure someone has done
this before and named it something other than 'data hub'.)

We are going to make use of a cache module as implemented in [JSCache][].

### Constraints:

* The application imports the data hub and only the data hub.
* The application gets access to data in a human readable way.
  eg: <code>client = dataHub.client.get();</code>


This implementation is very application specific in that the data hub contents
is tightly coupled to the data it provides. As such, the contents of this
repository is an example of code. There are some generics that can be tested.
Notably, there is have used a generic factory class that does the caching
necessary. The use of the generic class means that caching can be implemented
and tested once. Testing the caching feature on actual API classes should be
unnecessary.

Mantra:

* Write code that is easy to change, design code that never has to.
* Write code that is easy to test, design code so it is already tested.

## Expected Usage:

> Note: The API is going to return promises rather than actual data. I have
> left out 'then' and 'cache' logistics.

```
import dataHub from './path/to/custom/datahub';

newClient = dataHub.client.create(createAttributes);
clientList = dataHub.client.list();
specificClient = dataHub.client.get({id: clientId});
specificClient.update(newAttributes);
specificClient.delete();
```

We can extend the human readable DSL by teaching our objects about relations. Our client above may have a invoices, for example. The implementation will use a simple mixin to teach the client to provide invoice data.

Because the data hub uses caching, we can access invoices through the data hub.

```
invoiceList = dataHub.client.get({id: clientId}).invoiceList();
invoice = dataHub.client({id: clientId}).invoice({id: invoiceNumber});
```

If we ask for something that isn't cached, the data hub will take care of
fetching it through the API. If there is a failure in the chain the
application should get the appropriate exception. Assuming we are using
promises, the promise <code>catch</code> mechanism should take care of it.

Let's add promise syntax into this - let's say we're in react. The reaction
to a fulfilled promise is going to be to set the state.

```
invoiceList = dataHub.client.get({id: clientId}).invoiceList()
.then((list)=>{ this.setState({ invoiceList: list }) })
.catch((reason) => {
  this.setState({ error: reason });
});
invoice = dataHub.client({id: clientId}).invoice({id: invoiceNumber})
.then((invoice)=>{ this.setState({ invoice: invoice }) })
.catch((reason) => {
  this.setState({ error: reason });
});
```

If we are using react and thinking reactively, we'll have the client in our
component's props so we don't need the cache to access the invoices. The
code lines are shorter, simpler, but the result is much the same:

```
invoiceList = this.props.client.invoiceList()
.then(...)
.catch(...);
invoice = this.props.client.invoice({id: invoiceNumber})
.then(...)
.catch(...);
```

[JSCache]: https://github.com/twoodcock/JSCache

# Refactoring the DSL

It might be better to refine the DSL for the hub. This requires more class
customization.

```
invoice = dataHub.client("ActualClientID").invoice(42);
invoicesByClient = dataHub.listClients(criteria)
.then (client=>client.listInvoices());
newClient = dataHub.createClient(attributeObject);
```

This also points to a problem. When you get a list, what does the list contain?
Does a list of clients contain a list of full client objects? Does the API
return all the attributes required to show a client detail page when it returns
a list? What is the distinction and how do we convert clientList[0] to a client
we can use to show that detail page? When we do so, does the object stored inside the client list become the fully fleshed out object? (no.)....

TL/DR: I might have a logistics problem to solve.
