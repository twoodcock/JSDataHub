# JSDataHub

Note: This project contains currently experimental code.

# Class Name:

DataHub : Fount of all knowledge, source of all data.

# Summary

Premise: The application should be able to load the data hub and use it to
access all its data using a simple syntax. Moreover, when you ask the hub for
the same object twice, you should, ideally, get the same object instance back.

* The application should be able to let the data hub take care of talking to
  the API and deciding what should be cached.
* The application needs to know what data it is able to get.
* The application knows nothing about how the data is acquired.

### Constraints:

* The application imports the data hub and only the data hub.
* The application gets access to data in a human readable way.
  eg: <code>client = dataHub.client.get(clientAttributes);</code>

The implementation of the data hub is application specific. It might be made
generic, but the idea is so simple it is probably better not to.

This project includes example code for the data hub. It also includes the cache
from [JSCache][] and a tested generic factory implementation that automates
caching data.

## Expected Usage:

> Note: APIs used to acquire data from remote sources are likely to return
> promises rather than actual data. Most examples here show data being accessed
> directly.
>
> I do not see any problem with caching promises instead of actual object. In
> fact, I see this as a great advantage.

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
invoice = dataHub.client.get({id: clientId}).invoice({id: invoiceNumber});
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
invoice = dataHub.client.get({id: clientId}).invoice({id: invoiceNumber})
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
.then (list=>list.map((client)=>client.listInvoices()));
newClient = dataHub.createClient(attributeObject);
```

Does anything need refactoring for this or is the the job of the factory class
definition (that which extends the generic factory? I think this is the
implementor's job.

There is an inherant issue: What does a list contain? It might contain an item
that has partial data. Thas is <code>list[0]</code> might not contain the same
data as <code>factory.get(itemIdentfier)</code>.
