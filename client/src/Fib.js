import React, { Component } from 'react';
//Axios se usa para hacer peticiones al backend server
import axios from 'axios';

//Definimos una clase propia llamada Fib e inicializamos. Dentro de esta clase va a estar
//todo el código
class Fib extends Component {
  state = {
    seenIndexes: [],
    values: {},
    index: ''
  };

  //Este método se llama para insertar componentes en el DOM (creo). Es de React.
  componentDidMount() {
    this.fetchValues();
    this.fetchIndexes();
  }

  async fetchValues() {
    const values = await axios.get('/api/values/current');
    this.setState({ values: values.data });
  }

  async fetchIndexes() {
    const seenIndexes = await axios.get('/api/values/all');
    this.setState({
      seenIndexes: seenIndexes.data
    });
  }

  handleSubmit = async event => {
    event.preventDefault();

    await axios.post('/api/values', {
      index: this.state.index
    });
    this.setState({ index: '' });
  };

  renderSeenIndexes() {
    //Va a leer cada número en el array y los va a concatenar con la coma
    //y un espacio en blanco gracias al join
    return this.state.seenIndexes.map(({ number }) => number).join(', ');
  }

  //Esta función es diferente a la de los indices ya que como viene de  Redis, recibimos
  //objetos
  renderValues() {
    const entries = [];

    for (let key in this.state.values) {
      entries.push(
        <div key={key}>
          For index {key} I calculated {this.state.values[key]}
        </div>
      );
    }

    return entries;
  }

  render() {
    return (
      <div>
        <form onSubmit={this.handleSubmit}>
          <label>Enter your index:</label>
          <input
            value={this.state.index}
            onChange={event => this.setState({ index: event.target.value })}
          />
          <button>Submit</button>
        </form>

        <h3>Indexes I have seen:</h3>
        {this.renderSeenIndexes()}

        <h3>Calculated Values:</h3>
        {this.renderValues()}
      </div>
    );
  }
}

export default Fib;
